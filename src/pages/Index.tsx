import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
        } else {
          setUser(session.user);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        // Mesmo com erro, tentamos liberar a tela para não ficar branca eterna
        setLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && iframeLoaded && iframeRef.current) {
      const payload = {
        type: 'INIT_SUPABASE',
        url: import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.VITE_SUPABASE_ANON_KEY,
        userId: user.id
      };
      
      try {
        iframeRef.current.contentWindow?.postMessage(payload, '*');
      } catch (e) {
        console.error("Erro ao comunicar com iframe", e);
      }
    }
  }, [user, iframeLoaded]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Desconectado com sucesso");
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const iframeSrc = useRef(`/lifeos-v3.html?v=${Date.now()}`);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 animate-pulse">Carregando sistema...</p>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <button 
          onClick={handleLogout}
          className="bg-black/80 hover:bg-black/100 backdrop-blur-md text-white/90 hover:text-white px-5 py-3 rounded-full flex items-center gap-3 text-sm font-semibold transition-all shadow-xl shadow-black/20 border border-white/20 hover:scale-105 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair do LifeOS</span>
        </button>
      </div>
      <iframe
        ref={iframeRef}
        onLoad={handleIframeLoad}
        src={iframeSrc.current}
        title="Life OS v3"
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      />
    </>
  );
};

export default Index;
