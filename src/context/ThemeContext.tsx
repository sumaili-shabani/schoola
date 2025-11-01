import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem('theme');
        return (stored as Theme) || 'light';
    });

    // const toggleTheme = () => {

    //     const body = document.body;
    //     if (body.classList.contains('dark')) {
    //         body.classList.remove('dark');
    //         body.classList.add('light');
    //         localStorage.setItem('theme', 'light');
    //     } else {
    //         body.classList.remove('light');
    //         body.classList.add('dark');
    //         localStorage.setItem('theme', 'dark');

    //     }

       
    // };

    const toggleTheme = () => {
        setTheme((prev) => {
            const newTheme = prev === "light" ? "dark" : "light";
            document.body.classList.remove(prev);
            document.body.classList.add(newTheme);
            localStorage.setItem("theme", newTheme);
            return newTheme;
        });
    };

  
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.add(savedTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
