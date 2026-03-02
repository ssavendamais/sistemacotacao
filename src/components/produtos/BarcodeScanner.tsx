"use client";

import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<ReturnType<typeof import("@zxing/browser").BrowserMultiFormatReader.prototype.decodeFromVideoDevice> | null>(null);

  const stopScanner = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      setError(null);
      setScanning(true);

      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      // Prefer rear camera
      const rearCamera = devices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("traseira")
      );
      const deviceId = rearCamera?.deviceId || devices[0]?.deviceId || undefined;

      if (!videoRef.current) return;

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            if (text) {
              onDetected(text);
              stopScanner();
            }
          }
          // Ignore errors during scanning (normal when no barcode visible)
        }
      );

      // Keep reference to stream for cleanup
      if (videoRef.current?.srcObject) {
        streamRef.current = videoRef.current.srcObject as MediaStream;
      }
    } catch (err) {
      setError(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      );
      setScanning(false);
    }
  }, [onDetected, stopScanner]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="relative rounded-[var(--radius-lg)] overflow-hidden bg-neutral-900">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {/* Scan overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-40 border-2 border-primary-400 rounded-[var(--radius-lg)] relative">
              <div className="absolute inset-0 bg-primary-500/5" />
              {/* Scanning line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-primary-500 animate-scan" />
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary-500 rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-500 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary-500 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary-500 rounded-br" />
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
            <div className="text-center px-6 space-y-3">
              <Camera className="h-10 w-10 text-neutral-400 mx-auto" />
              <p className="text-sm text-neutral-300">{error}</p>
              <Button variant="secondary" size="sm" onClick={startScanner}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800">
        <p className="text-xs text-neutral-400">
          {scanning ? "Posicione o código de barras na área de leitura" : "Scanner parado"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopScanner();
            onClose();
          }}
          className="text-neutral-400 hover:text-white"
        >
          <X className="h-4 w-4" />
          Fechar
        </Button>
      </div>
    </div>
  );
}

/* ─── USB Barcode Reader Hook ─── */
export function useUSBBarcodeReader(onDetected: (barcode: string) => void) {
  const bufferRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused on an input/textarea (let user type normally)
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Enter" && bufferRef.current.length >= 4) {
        onDetected(bufferRef.current);
        bufferRef.current = "";
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Only accept alphanumeric for barcode
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Reset after 100ms of no input (USB readers send chars rapidly)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = "";
        }, 100);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onDetected]);
}
