import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  const logClickInfo = (eventName, event) => {
    const topElement = document.elementFromPoint(
      event.clientX,
      event.clientY
    );

    console.log(`------ ${eventName} ------`);
    console.log("Clicked target:", event.target);
    console.log("Top element:", topElement);
    console.log("Target tag:", event.target?.tagName);
    console.log("Top element tag:", topElement?.tagName);
    console.log("Target class:", event.target?.className);
    console.log("Top element class:", topElement?.className);
    console.log("Default prevented:", event.defaultPrevented);
  };

  document.addEventListener(
    "pointerdown",
    (event) => logClickInfo("POINTERDOWN", event),
    true
  );

  document.addEventListener(
    "mousedown",
    (event) => logClickInfo("MOUSEDOWN", event),
    true
  );

  document.addEventListener(
    "click",
    (event) => logClickInfo("CLICK", event),
    true
  );
}

const rootElement = document.getElementById("root");

ReactDOM.createRoot(rootElement).render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);