const desplazamientos: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

export function activarIndiceDocumental(root: HTMLElement, alCambiar?: () => void) {
  const indice = root.querySelector<HTMLElement>('[data-indice-documental]');
  if (!indice) return;

  const hojas = [...indice.querySelectorAll<HTMLButtonElement>('button[aria-controls]')].flatMap((boton) => {
    const hoja = document.getElementById(boton.getAttribute('aria-controls') ?? '');
    return hoja && root.contains(hoja) ? [{ boton, hoja }] : [];
  });
  if (!hojas.length) return;

  const mostrar = (activa: number) => {
    hojas.forEach(({ boton, hoja }, i) => {
      const elegida = i === activa;
      boton.setAttribute('aria-selected', String(elegida));
      boton.tabIndex = elegida ? 0 : -1;
      hoja.hidden = !elegida;
    });
    alCambiar?.();
  };

  hojas.forEach(({ boton }, i) => {
    boton.addEventListener('click', () => mostrar(i));
    boton.addEventListener('keydown', (event) => {
      const desplazamiento = desplazamientos[event.key];
      let siguiente: number;
      if (event.key === 'Home') siguiente = 0;
      else if (event.key === 'End') siguiente = hojas.length - 1;
      else if (desplazamiento) siguiente = (i + desplazamiento + hojas.length) % hojas.length;
      else return;

      event.preventDefault();
      mostrar(siguiente);
      hojas[siguiente].boton.focus();
    });
  });

  const inicial = hojas.findIndex(({ boton }) => boton.getAttribute('aria-selected') === 'true');
  mostrar(Math.max(inicial, 0));
  indice.hidden = false;
}
