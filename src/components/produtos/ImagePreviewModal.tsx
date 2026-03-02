"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Modal } from "../ui/modal";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  productName: string;
}

export function ImagePreviewModal({
  open,
  onClose,
  imageUrl,
  productName,
}: ImagePreviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-2xl p-0 overflow-hidden dark:bg-neutral-900"
    >
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative w-full aspect-square bg-neutral-100 dark:bg-neutral-900">
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain"
            sizes="(max-width: 672px) 100vw, 672px"
          />
        </div>
        <div className="px-6 py-4 bg-white dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-700">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
            {productName}
          </p>
        </div>
      </div>
    </Modal>
  );
}
