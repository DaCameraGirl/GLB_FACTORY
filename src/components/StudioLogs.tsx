import { useEffect, useRef } from "react";
import { LogEntry } from "../types";
import { Terminal, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

interface StudioLogsProps {
  logs: LogEntry[];
}

export default function StudioLogs({ logs }: StudioLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF41]" id="log-success-icon" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" id="log-warning-icon" />;
      case "error":
        return <XCircle className="w-3.5 h-3.5 text-red-500" id="log-error-icon" />;
      case "info":
      default:
        return <Info className="w-3.5 h-3.5 text-[#00FF41]/70" id="log-info-icon" />;
    }
  };

  const getColorClass = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-[#00FF41] font-bold";
      case "warning":
        return "text-yellow-200/90";
      case "error":
        return "text-red-400";
      case "info":
      default:
        return "text-[#00FF41]/90";
    }
  };

  return (
    <div className="flex flex-col border-2 border-[#141414] rounded-none overflow-hidden bg-black text-[#00FF41]" id="studio-logs-container">
      <div className="flex items-center justify-between px-4 py-2 bg-[#141414] border-b border-[#141414] font-mono text-[11px] text-[#E4E3E0] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00FF41]" />
          <span>MESH ENGINE CONSOLE // STABLE</span>
        </div>
        <span className="text-[9px] text-[#00FF41] bg-[#00FF41]/10 px-1.5 py-0.5 animate-pulse">ACTIVE_STREAM</span>
      </div>

      <div
        ref={containerRef}
        className="p-4 h-[180px] overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-none"
        id="logs-scroll-viewport"
      >
        {logs.length === 0 ? (
          <div className="text-[#00FF41]/30 flex items-center justify-center h-full italic">
            _ SYSTEM IDLE. AWAITING PORTRAIT INPUT BUFFER...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2 leading-normal transition-all duration-300 ${getColorClass(
                log.type
              )}`}
              id={`log-item-${log.id}`}
            >
              <span className="text-[10px] text-[#00FF41]/40 shrink-0 select-none">
                [{log.timestamp}]
              </span>
              <div className="shrink-0 pt-0.5">{getIcon(log.type)}</div>
              <p className="whitespace-pre-wrap break-all uppercase tracking-wide">{log.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
