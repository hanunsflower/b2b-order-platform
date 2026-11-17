import { useState } from "react";
import { ImageOff } from "lucide-react";
import styles from "./ProductImage.module.css";

// Shows the product photo, or a neat placeholder when there is no link or it fails to load.
export default function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={styles.placeholder}>
        <ImageOff size={28} />
      </div>
    );
  }
  return (
    <img
      className={styles.img}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
