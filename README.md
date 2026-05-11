# Good or Bad Game

Good or Bad Game es un juego social para jugar en una misma pantalla. En cada ronda, una persona recibe un numero secreto del 1 al 10 y escribe una pista ambigua. El resto del grupo intenta adivinar que numero era segun la escala:

- 1 = muy malo
- 10 = muy bueno

La gracia esta en dar una pista clara, pero no demasiado obvia.

## Reglas

1. Configura jugadores, nombres, cantidad de rondas y orden de turnos.
2. En cada ronda, el jugador activo revela en privado su numero secreto.
3. El jugador activo escribe una pista sin decir el numero.
4. Los demas jugadores ingresan una respuesta del 1 al 10.
5. Se revela el numero y se asignan puntos.

## Puntaje de quienes adivinan

- Diferencia 0: 5 puntos
- Diferencia 1: 3 puntos
- Diferencia 2: 2 puntos
- Diferencia 3: 1 punto
- Diferencia 4 o mas: 0 puntos

## Puntaje del jugador activo

- Al menos un acierto exacto: 3 puntos
- Mejor respuesta a distancia 1: 2 puntos
- Mejor respuesta a distancia 2: 1 punto
- Todas las respuestas a distancia 3 o mas: 0 puntos

## Desempate

Si hay empate en puntos y aciertos exactos, se activa una ronda final. Los jugadores empatados escriben una pista para el mismo numero secreto y los votantes eligen la mejor. Si no hay jugadores externos, todos votan excepto por su propia pista.

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS
- localStorage
- Vitest
- Vercel

## Correr localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Tests y build

```bash
npm run test
npm run lint
npm run build
```

## Despliegue en Vercel

```bash
npx vercel
npx vercel --prod
```

El proyecto no necesita variables de entorno para esta primera version.
