import { useEffect } from "react";
import landingCss from "@/landing/landing.css?raw";
import landingBody from "@/landing/body.html?raw";
import landingJs from "@/landing/landing.js?raw";

/**
 * Homepage = the standalone "interception moment" landing page, rendered inside
 * the React Index route so app routing (/privacy, etc.) stays intact. Markup +
 * styles are injected as raw assets; the landing's own script (stat counters,
 * demo registry lookup) runs once on mount.
 */
const Index = () => {
  useEffect(() => {
    // The design gates hero variants with `[data-dir]{display:none}` shown only
    // under `body.dir-a`. We inject into a div, so set the class on <body> or the
    // photo hero stays hidden.
    document.body.classList.add("dir-a");

    const runLanding = () => {
      const script = document.createElement("script");
      script.textContent = landingJs;
      script.id = "landing-runtime";
      document.body.appendChild(script);
    };
    // Lucide icons come from a CDN in the original <head>; load it, then run the
    // landing script (which calls lucide.createIcons + sets up the demos).
    if ((window as unknown as { lucide?: unknown }).lucide) {
      runLanding();
    } else {
      const lucide = document.createElement("script");
      lucide.src = "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js";
      lucide.onload = runLanding;
      lucide.onerror = runLanding; // run anyway; icons just won't render
      lucide.id = "lucide-cdn";
      document.body.appendChild(lucide);
    }
    return () => {
      document.getElementById("landing-runtime")?.remove();
      document.body.classList.remove("dir-a");
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: landingCss }} />
      <div dangerouslySetInnerHTML={{ __html: landingBody }} />
    </>
  );
};

export default Index;
