import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // 1. Verificar autenticação e carregar estado inicial
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
        } else {
          setUser(session.user);
          
          // Carregar dados salvos no banco
          const { data, error } = await supabase
            .from("user_state")
            .select("state_json")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (error) {
            console.error("Erro ao carregar estado:", error);
          } else if (data && iframeRef.current) {
            // Enviar dados para o iframe
            iframeRef.current.contentWindow?.postMessage(
              { type: "LOAD_STATE", payload: data.state_json },
              "*"
            );
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro no carregamento:", error);
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 2. Ouvir mensagens do iframe para salvar no Supabase
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Sincronizar estado (SAVE_STATE)
      if (event.data.type === "SAVE_STATE" && user?.id) {
        const { error } = await supabase
          .from("user_state")
          .upsert({ 
            user_id: user.id, 
            state_json: event.data.payload,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error("Erro ao salvar no Supabase:", error);
        }
      }

      // Logout vindo de dentro do iframe
      if (event.data.type === "LOGOUT") {
        await supabase.auth.signOut();
        navigate("/login");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Desconectado com sucesso");
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    // Quando o iframe carregar, enviamos as chaves para ele se inicializar sozinho também
    if (user) {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'INIT_SUPABASE',
        url: import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.VITE_SUPABASE_ANON_KEY,
        userId: user.id
      }, '*');
    }
  };

  const iframeSrc = useRef(`/lifeos-v3.html?v=${Date.now()}`);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 animate-pulse">Sincronizando LifeOS...</p>
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
