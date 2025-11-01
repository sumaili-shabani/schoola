import React, { createContext, useContext, useEffect, useState } from "react";

type SidebarCtx = {
    collapsed: boolean;
    toggle: () => void;
    set: (v: boolean) => void;
};

const Ctx = createContext<SidebarCtx | null>(null);
const LS_KEY = "adminkit_sidebar_collapsed";

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        const saved = localStorage.getItem(LS_KEY);
        return saved ? saved === "true" : false;
    });

    const toggle = () => setCollapsed(v => !v);
    const set = (v: boolean) => setCollapsed(v);

    useEffect(() => {
        localStorage.setItem(LS_KEY, String(collapsed));
    }, [collapsed]);

    return <Ctx.Provider value={{ collapsed, toggle, set }}>{children}</Ctx.Provider>;
};

export const useSidebar = () => {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
};
