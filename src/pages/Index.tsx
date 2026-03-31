import { useState } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleDownload = () => {
    fetch("/safety-intercept.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "safety-intercept.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 glow-primary">
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground text-center mb-4">
          Safety <span className="text-primary">Intercept</span>
        </h1>
        <p className="text-muted-foreground text-lg text-center max-w-md mb-10 leading-relaxed">
          A Chrome extension that monitors threats, blocks malicious redirects, and keeps your browsing safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={handleDownload}
            className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all glow-primary cursor-pointer"
          >
            ⬇ Download Extension
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-8 py-3.5 rounded-xl bg-secondary text-foreground font-bold text-sm border border-border hover:bg-border transition-all cursor-pointer"
          >
            🛡️ Preview Modal
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            { icon: "✕", title: "Threat Blocking", desc: "Blocks suspicious redirects and malicious scripts in real-time.", color: "destructive" },
            { icon: "!", title: "Smart Warnings", desc: "Flags mixed content and insecure resources on any page.", color: "warning" },
            { icon: "✓", title: "HTTPS Verified", desc: "Continuously verifies secure connections across all tabs.", color: "accent" },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-2xl p-6">
              <div className={`w-10 h-10 rounded-xl bg-${f.color}/15 flex items-center justify-center text-${f.color} font-bold text-sm mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-foreground font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Install Steps */}
        <div className="mt-16 max-w-lg w-full">
          <h2 className="text-xl font-bold text-foreground text-center mb-6">Installation</h2>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {[
              "Download and unzip the extension file",
              "Open chrome://extensions in your browser",
              "Enable Developer mode (top-right toggle)",
              "Click \"Load unpacked\" and select the folder",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <span className="text-muted-foreground/50 text-xs">Safety Intercept v1.0.0 • Built with React 19 & Tailwind CSS v4</span>
      </footer>

      <SafetyInterceptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Disable Protection?"
        message="Turning off Safety Intercept will leave your browsing session unprotected. Malicious scripts and unsafe redirects will not be blocked."
      />
    </div>
  );
};

export default Index;
