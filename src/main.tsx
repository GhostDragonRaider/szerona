/**
 * React gyökér: globális Emotion reset, téma provider lánc (AppProviders), Router, App betöltése.
 */
import { Global, css } from "@emotion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";

const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  html {
    scroll-behavior: smooth;
    overflow-x: hidden;
    overflow-x: clip;
    max-width: 100%;
  }
  body {
    margin: 0;
    min-height: 100vh;
    min-height: 100dvh;
    overflow-x: hidden;
    overflow-x: clip;
    max-width: 100%;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
    padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0)
      env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  }
  #root {
    min-height: 100vh;
    min-height: 100dvh;
    max-width: 100%;
    overflow-x: hidden;
    overflow-x: clip;
  }
  img {
    max-width: 100%;
    height: auto;
  }
`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Global styles={globalStyles} />
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
