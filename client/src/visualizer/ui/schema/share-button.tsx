/**
 * Share button component for generating shareable URLs with encoded schemas.
 */

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import { useToast } from "@/shared/ui-components/toast";
import {
  encodeSchemaToUrl,
  estimateEncodedSize,
} from "@/shared/utils/url-encoding";
import { createShareableUrl } from "@/shared/utils/url-state";
import type { SchemaFormat } from "@/schemas/parsers";

interface ShareButtonProps {
  /**
   * The schema text to encode and share
   */
  schemaText: string;

  /**
   * The format of the schema (sql or mermaid)
   */
  format: SchemaFormat;

  /**
   * Optional className for styling
   */
  className?: string;

  /**
   * Button variant
   */
  variant?: "default" | "outline" | "ghost";

  /**
   * Button size
   */
  size?: "default" | "sm" | "lg" | "icon";
}

// Maximum recommended URL length (most browsers support 2000+ chars)
const MAX_SAFE_URL_LENGTH = 2000;

/**
 * Share button component that generates a shareable URL with encoded schema.
 * Copies the URL to clipboard when clicked.
 *
 * @example
 * ```tsx
 * <ShareButton
 *   schemaText={sqlSchema}
 *   format="sql"
 *   variant="outline"
 *   size="sm"
 * />
 * ```
 */
export function ShareButton({
  schemaText,
  format,
  className = "",
  variant = "outline",
  size = "sm",
}: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      // Check if schema is too large
      const estimatedSize = estimateEncodedSize(schemaText);

      if (estimatedSize > MAX_SAFE_URL_LENGTH) {
        toast.error(
          `Schema is very large (${Math.round(estimatedSize / 1024)}KB). May not work in all browsers.`,
          5000
        );
        // Continue anyway - let the user decide
      }

      // Encode the schema
      const encoded = encodeSchemaToUrl(schemaText);

      // Create shareable URL
      const shareableUrl = createShareableUrl(encoded, format);

      // Copy to clipboard
      await navigator.clipboard.writeText(shareableUrl);

      // Show success feedback
      setIsCopied(true);
      toast.success("Shareable link copied to clipboard");

      // Reset icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to create share URL:", error);
      toast.error("Failed to create shareable URL");
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={className}
      title="Share schema via URL"
    >
      {isCopied ? (
        <>
          <Check size={12} className="hidden sm:block sm:w-3.5 sm:h-3.5" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={12} className="hidden sm:block sm:w-3.5 sm:h-3.5" />
          <span>Share</span>
        </>
      )}
    </Button>
  );
}
