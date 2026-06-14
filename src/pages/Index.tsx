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
    const script = document.createElement("script");
    script.textContent = landingJs;
    document.body.appendChild(script);
    return () => {
      script.remove();
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
