"use client"

import { useEffect, useState } from "react"
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState();

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {resolvedTheme === "dark" ? (
                <Sun className=" h-5 w-5" />
            ) : (
                <Moon className=" h-5 w-5 text-gray-400"/>
            )}
        </Button>
    )
};