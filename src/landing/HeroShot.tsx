import { useState } from "react";

interface HeroShotProps {
  /** Print do sistema. Basta colocar o arquivo em public/ para o slot preencher. */
  src?: string;
  legenda?: string;
  placeholder?: string;
}

/**
 * Moldura de navegador com o print do WebGIS.
 *
 * No Claude Design este bloco é um <image-slot> (componente do canvas, que
 * aceita arrastar-e-soltar e persiste num sidecar .image-slots.state.json).
 * Na aplicação o slot vira estático: se o arquivo existir em `public/`, ele
 * aparece; senão, mostramos o mesmo estado vazio com a instrução do design.
 */
export default function HeroShot({
  src = "/hero-webgis.png",
  legenda = "bzr-webgis / mapa",
  placeholder = "Coloque um print do mapa/dashboard do BzR WebGIS em public/hero-webgis.png",
}: HeroShotProps) {
  const [carregou, setCarregou] = useState(false);
  const [falhou, setFalhou] = useState(false);

  return (
    <div className="shot">
      <div className="frame">
        <div className="bar">
          <i />
          <i />
          <i />
          <span className="u">{legenda}</span>
        </div>
        <div className="slot">
          {!falhou && (
            <img
              src={src}
              alt="Tela do BzR WebGIS"
              style={carregou ? undefined : { display: "none" }}
              onLoad={() => setCarregou(true)}
              onError={() => setFalhou(true)}
            />
          )}
          {!carregou && (
            <div className="empty">
              <span className="mk" aria-hidden="true" />
              <span>{placeholder}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
