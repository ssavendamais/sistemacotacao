'use server'

import { getUserRole } from '@/lib/roles.server'
import { createClient } from '@/lib/supabase/server'
import type { ProductWithQuote } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Storage helpers ──────────────────────────────────────────────────────────

/**
 * Extrai o path relativo dentro do bucket a partir de uma URL pública do Supabase.
 * Ex: "https://<proj>.supabase.co/storage/v1/object/public/products/products/product-123.webp"
 *   → "products/product-123.webp"
 * Retorna null se a URL não pertencer ao nosso bucket ou não for do Supabase.
 */
function extractStoragePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  try {
    const url = new URL(imageUrl)
    // Supabase Storage path format: /storage/v1/object/public/{bucket}/{path}
    const marker = '/storage/v1/object/public/products/'
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    const relativePath = url.pathname.slice(idx + marker.length)
    return relativePath || null
  } catch {
    return null
  }
}

/**
 * Remove imagem anterior do Supabase Storage se ela pertencer ao nosso bucket.
 * Fire-and-forget: não bloqueia o upload novo em caso de falha.
 */
async function removeOldProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  oldImageUrl: string | null | undefined,
): Promise<void> {
  const path = extractStoragePath(oldImageUrl)
  if (!path) return
  try {
    await supabase.storage.from('products').remove([path])
  } catch {
    // Falha silenciosa — não impede novo upload
  }
}


interface GetProductsParams {
  search?: string
  category?: string
  barcode?: string
  dateFrom?: string
  dateTo?: string
  priceMin?: string
  priceMax?: string
  page?: number
  perPage?: number
}

interface GetProductsResult {
  products: ProductWithQuote[]
  total: number
  categories: { id: string; name: string; slug: string; color: string }[]
}

export async function getProducts(params: GetProductsParams = {}): Promise<GetProductsResult> {
  const supabase = await createClient()
  const { search, category, barcode, dateFrom, dateTo, page = 1, perPage = 20 } = params

  // Base query
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })

  // Filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (category) {
    query = query.eq('category', category)
  }
  if (barcode) {
    query = query.ilike('barcode', `%${barcode}%`)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  // Pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data: products, error, count } = await query

  if (error) throw new Error(error.message)

  // Fetch latest quote for each product
  const productIds = (products ?? []).map((p) => p.id)
  let quotesMap: Record<string, { company_name: string; price: number; created_at: string; id: string; product_id: string }> = {}

  if (productIds.length > 0) {
    const { data: allQuotes } = await supabase
      .from('product_quotes')
      .select('*')
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    if (allQuotes) {
      for (const quote of allQuotes) {
        if (!quotesMap[quote.product_id]) {
          quotesMap[quote.product_id] = quote
        }
      }
    }
  }

  // Fetch categories from the categories table
  const { data: catData } = await supabase
    .from('categories')
    .select('id, name, slug, color')
    .order('name', { ascending: true })

  const categories = (catData ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, color: c.color ?? '#6366f1' }))

  // Fetch product → category associations
  let productCategoriesMap: Record<string, { id: string; name: string; slug: string; color: string; description: string | null; organization_id: string | null; created_at: string }[]> = {}
  if (productIds.length > 0) {
    const { data: pcData } = await supabase
      .from('product_categories')
      .select('product_id, category_id')
      .in('product_id', productIds)

    if (pcData && catData) {
      const catMap = Object.fromEntries((catData ?? []).map((c) => [c.id, c]))
      for (const row of pcData) {
        const cat = catMap[row.category_id]
        if (cat) {
          if (!productCategoriesMap[row.product_id]) productCategoriesMap[row.product_id] = []
          productCategoriesMap[row.product_id].push({ ...cat, color: cat.color ?? '#6366f1', description: null, organization_id: null, created_at: '' })
        }
      }
    }
  }

  // Filter by price range if specified (via latest quote)
  let enrichedProducts: ProductWithQuote[] = (products ?? []).map((p) => ({
    ...p,
    latest_quote: quotesMap[p.id] ?? null,
    categories: productCategoriesMap[p.id] ?? [],
  }))

  if (params.priceMin || params.priceMax) {
    const min = params.priceMin ? parseFloat(params.priceMin) : 0
    const max = params.priceMax ? parseFloat(params.priceMax) : Infinity
    enrichedProducts = enrichedProducts.filter((p) => {
      if (!p.latest_quote) return false
      return p.latest_quote.price >= min && p.latest_quote.price <= max
    })
  }

  return {
    products: enrichedProducts,
    total: count ?? 0,
    categories,
  }
}

export async function getProduct(id: string) {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  // Get all quotes for this product
  const { data: quotes } = await supabase
    .from('product_quotes')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false })

  return { ...product, quotes: quotes ?? [] }
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para criar produtos.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const barcode = formData.get('barcode') as string
  const category = formData.get('category') as string
  const imageUrl = formData.get('image_url') as string
  const priceUnitStore = formData.get('price_unit_store') as string

  if (!name?.trim()) {
    return { error: 'Nome do produto é obrigatório.' }
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      barcode: barcode?.trim() || null,
      image_url: imageUrl?.trim() || null,
      category: category?.trim() || null,
      price_unit_store: priceUnitStore ? parseFloat(priceUnitStore) : 0,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505' && error.message.includes('barcode')) {
      return { error: 'Já existe um produto com este código de barras.' }
    }
    return { error: error.message }
  }

  revalidatePath('/empresario/produtos')
  return { success: true, productId: product.id }
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para editar produtos.' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const barcode = formData.get('barcode') as string
  const category = formData.get('category') as string
  const imageUrl = formData.get('image_url') as string
  const priceUnitStore = formData.get('price_unit_store') as string

  if (!name?.trim()) {
    return { error: 'Nome do produto é obrigatório.' }
  }

  const updateData: Record<string, unknown> = {
    name: name.trim(),
    description: description?.trim() || null,
    barcode: barcode?.trim() || null,
    image_url: imageUrl?.trim() || null,
    category: category?.trim() || null,
  }
  if (priceUnitStore !== null && priceUnitStore !== undefined && priceUnitStore !== '') {
    updateData.price_unit_store = parseFloat(priceUnitStore)
  }

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)

  if (error) {
    if (error.code === '23505' && error.message.includes('barcode')) {
      return { error: 'Já existe um produto com este código de barras.' }
    }
    return { error: error.message }
  }

  revalidatePath('/empresario/produtos')
  revalidatePath(`/empresario/produtos/editar/${id}`)
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin') {
    return { error: 'Apenas administradores podem excluir produtos.' }
  }

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/empresario/produtos')
  return { success: true }
}

export async function deleteProductsBatch(ids: string[]) {
  const supabase = await createClient()
  const role = await getUserRole()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  if (role !== 'admin' && role !== 'moderador') {
    // Verifica logica de empresário (só pode deletar os proprios)
    // Para simplificar, limitamos exclusão múltipla ou a admin/moderador ou valida org
    const { data: profile } = await supabase.from('profiles').select('active_organization_id').eq('id', user.id).single()
    if (!profile?.active_organization_id) {
       return { error: 'Sem permissão para excluir produtos em lote.' }
    }
    // empresários podem deletar da sua org
    const { data: productsCheck } = await supabase
      .from('products')
      .select('id, organization_id')
      .in('id', ids)

    if (!productsCheck || productsCheck.some(p => p.organization_id !== profile.active_organization_id)) {
      return { error: 'Um ou mais produtos não pertencem à sua organização.' }
    }
  }

  // Busca urls para deletar do storage
  const { data: products } = await supabase.from('products').select('id, image_url').in('id', ids)
  
  if (products && products.length > 0) {
    const imagesToRemove = products.map(p => extractStoragePath(p.image_url)).filter(Boolean) as string[]
    if (imagesToRemove.length > 0) {
      try {
        await supabase.storage.from('products').remove(imagesToRemove)
      } catch {
        // failed storage delete doesnt block db delete
      }
    }
  }

  const { error } = await supabase.from('products').delete().in('id', ids)

  if (error) return { error: error.message }

  revalidatePath('/empresario/produtos')
  return { success: true }
}

export async function batchUpdateProducts(
  productIds: string[],
  field: 'category',
  value: string
) {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para edição em lote.' }
  }

  if (productIds.length === 0) {
    return { error: 'Nenhum produto selecionado.' }
  }

  const { error } = await supabase
    .from('products')
    .update({ [field]: value.trim() || null })
    .in('id', productIds)

  if (error) return { error: error.message }

  revalidatePath('/empresario/produtos')
  return { success: true, count: productIds.length }
}

export async function batchAddQuote(
  productIds: string[],
  companyName: string,
  price: number
) {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para adicionar cotações.' }
  }

  if (productIds.length === 0) {
    return { error: 'Nenhum produto selecionado.' }
  }

  const inserts = productIds.map((pid) => ({
    product_id: pid,
    company_name: companyName.trim(),
    price,
  }))

  const { error } = await supabase.from('product_quotes').insert(inserts)

  if (error) return { error: error.message }

  revalidatePath('/empresario/produtos')
  return { success: true, count: productIds.length }
}

export async function duplicateProduct(id: string) {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para duplicar produtos.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch original product
  const { data: original, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    return { error: 'Produto original não encontrado.' }
  }

  // Clone without barcode (unique constraint), without image, and preserve price
  const { data: newProduct, error: insertError } = await supabase
    .from('products')
    .insert({
      name: `${original.name} (cópia)`,
      description: original.description,
      barcode: null,
      image_url: null,
      category: original.category,
      price_unit_store: original.price_unit_store ?? 0,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/empresario/produtos')
  return { success: true, productId: newProduct.id }
}

export async function uploadProductImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para upload de imagens.' }
  }

  const file = formData.get('file') as File
  const productId = formData.get('productId') as string | null

  if (!file) return { error: 'Nenhum arquivo selecionado.' }

  // Guard de tamanho
  const MAX_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return { error: 'Imagem muito grande após compressão. Máximo: 5 MB.' }
  }

  const allowedTypes = [
    'image/webp', 'image/avif', 'image/jpeg', 'image/jpg',
    'image/png', 'image/gif', 'image/bmp', 'image/tiff',
  ]
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { error: `Formato inválido (${file.type}). Aceitos: JPG, PNG, WebP, AVIF.` }
  }

  // ── SUBSTITUIÇÃO SEGURA: remove imagem anterior do Storage ──────────────────
  if (productId) {
    const { data: existing } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', productId)
      .single()
    await removeOldProductImage(supabase, existing?.image_url)
  }

  let ext = 'webp'
  if (file.type === 'image/avif') ext = 'avif'
  else if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg'
  else if (file.type === 'image/png') ext = 'png'

  const fileName = productId
    ? `product-${productId}.${ext}`
    : `product-${Date.now()}.${ext}`
  const storagePath = `products/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: `${60 * 60 * 24 * 30}`,
      upsert: true,
    })

  if (uploadError) return { error: uploadError.message }

  const { data: publicUrl } = supabase.storage
    .from('products')
    .getPublicUrl(storagePath)

  return { url: publicUrl.publicUrl }
}

/**
 * Faz download de uma imagem via URL externa, verifica se é uma imagem válida,
 * e armazena no Supabase Storage (não salva apenas o link externo).
 * A compressão WebP já deve ter sido feita client-side antes de chamar esta action.
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  productId?: string | null,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para upload de imagens.' }
  }

  // Valida formato da URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(imageUrl.trim())
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return { error: 'URL deve usar https ou http.' }
    }
  } catch {
    return { error: 'URL inválida.' }
  }

  // Faz download da imagem no servidor
  let imageBuffer: ArrayBuffer
  let contentType: string
  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'VendaMais-Bot/1.0' },
      signal: AbortSignal.timeout(15_000), // timeout 15s
    })

    if (!response.ok) {
      return { error: `Não foi possível baixar a imagem (HTTP ${response.status}).` }
    }

    contentType = response.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return { error: 'A URL não aponta para uma imagem válida.' }
    }

    // Limita download a 15 MB
    const MAX_DOWNLOAD = 15 * 1024 * 1024
    const contentLength = Number(response.headers.get('content-length') ?? 0)
    if (contentLength > MAX_DOWNLOAD) {
      return { error: 'Imagem muito grande. Máximo: 15 MB para download.' }
    }

    imageBuffer = await response.arrayBuffer()

    if (imageBuffer.byteLength > MAX_DOWNLOAD) {
      return { error: 'Imagem baixada excede 15 MB.' }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return { error: 'Timeout ao baixar imagem. Tente outra URL.' }
    }
    return { error: 'Erro ao baixar imagem da URL fornecida.' }
  }

  // Detecta extensão pelo content-type
  let ext = 'webp'
  if (contentType.includes('png')) ext = 'png'
  else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
  else if (contentType.includes('avif')) ext = 'avif'
  else if (contentType.includes('gif')) ext = 'gif'

  // ── SUBSTITUIÇÃO SEGURA: remove imagem anterior do Storage ──────────────────
  if (productId) {
    const { data: existing } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', productId)
      .single()
    await removeOldProductImage(supabase, existing?.image_url)
  }

  const fileName = productId
    ? `product-${productId}.${ext}`
    : `product-url-${Date.now()}.${ext}`

  const storagePath = `products/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(storagePath, imageBuffer, {
      contentType,
      cacheControl: `${60 * 60 * 24 * 30}`,
      upsert: true,
    })

  if (uploadError) return { error: uploadError.message }

  const { data: publicUrl } = supabase.storage
    .from('products')
    .getPublicUrl(storagePath)

  return { url: publicUrl.publicUrl }
}

/**
 * Remove a imagem de um produto:
 * 1. Apaga o arquivo do Supabase Storage
 * 2. Limpa o campo image_url no banco
 */
export async function removeProductImage(
  productId: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const role = await getUserRole()

  if (role !== 'admin' && role !== 'moderador') {
    return { error: 'Sem permissão para remover imagens.' }
  }

  // Busca a URL atual para saber qual arquivo apagar do storage
  const { data: product } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', productId)
    .single()

  if (product?.image_url) {
    // Extrai o path relativo dentro do bucket 'products'
    // URL formato: https://<proj>.supabase.co/storage/v1/object/public/products/products/product-{id}.webp
    try {
      const urlObj = new URL(product.image_url)
      const pathParts = urlObj.pathname.split('/storage/v1/object/public/products/')
      if (pathParts.length === 2 && pathParts[1]) {
        await supabase.storage.from('products').remove([pathParts[1]])
      }
    } catch {
      // Se falhar ao apagar do storage, continua para limpar o banco
    }
  }

  // Limpa image_url no banco
  const { error } = await supabase
    .from('products')
    .update({ image_url: null })
    .eq('id', productId)

  if (error) return { error: error.message }

  revalidatePath('/empresario/produtos')
  revalidatePath(`/empresario/produtos/editar/${productId}`)
  return { success: true }
}

