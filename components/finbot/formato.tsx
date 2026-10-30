import React from "react";

// Markdown mínimo: **negrita**, listas con "- " y párrafos.
export function Formato({ texto }: { texto: string }) {
  const negrita = (linea: string) =>
    linea.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p,
    );
  return (
    <>
      {texto.split(/\n{2,}/).map((bloque, i) => {
        const lineas = bloque.split("\n").filter(Boolean);
        if (lineas.length && lineas.every((l) => /^\s*[-•*]\s/.test(l))) {
          return (
            <ul key={i} className="list-disc pl-4 space-y-1 my-1.5">
              {lineas.map((l, j) => <li key={j}>{negrita(l.replace(/^\s*[-•*]\s/, ""))}</li>)}
            </ul>
          );
        }
        return (
          <p key={i} className="my-1.5 first:mt-0 last:mb-0">
            {lineas.map((l, j) => (
              <React.Fragment key={j}>{j > 0 && <br />}{negrita(l)}</React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
