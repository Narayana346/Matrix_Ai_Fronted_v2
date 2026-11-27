import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Mail, User, Lock, ShieldCheck, Workflow, Zap } from "lucide-react";
import { api, setAuthToken, setUserInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

const FEATURES = [
    { icon: Zap, text: "Ship full-stack apps from a single prompt" },
    { icon: Workflow, text: "Live preview, code and chat in one workspace" },
    { icon: ShieldCheck, text: "Your projects, versioned and backed up" },
];

export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password) {
            toast({
                title: "Missing details",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.signup({ name, username: email, password });
            setAuthToken(response.token);
            setUserInfo(response.user);
            toast({
                title: "Welcome!",
                description: "Account created successfully",
            });
            navigate("/projects");
        } catch (error) {
            toast({
                title: "Signup failed",
                description: error instanceof Error ? error.message : "Could not create account",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Branding panel */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-border/50">
                <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-panel)" }} />
                <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-primary/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-secondary/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

                <Logo size="md" withWordmark />

                <div className="relative max-w-md animate-fade-in">
                    <h2 className="text-3xl font-semibold text-foreground mb-4 leading-tight">
                        Build software by just <span className="gradient-text">describing it.</span>
                    </h2>
                    <ul className="space-y-4">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                                    <Icon className="w-4 h-4" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-muted-foreground/70">© {new Date().getFullYear()} Matrix AI. All rights reserved.</p>
            </div>

            {/* Form panel */}
            <div className="relative flex items-center justify-center p-4 sm:p-8">
                <div className="absolute inset-0 overflow-hidden lg:hidden">
                    <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                </div>

                <div className="relative w-full max-w-md animate-slide-up">
                    <div className="lg:hidden flex justify-center mb-8">
                        <Logo size="lg" />
                    </div>

                    <div className="mb-8 text-center lg:text-left">
                        <h1 className="text-2xl font-semibold text-foreground mb-2">Create an account</h1>
                        <p className="text-muted-foreground text-sm">Start building your next big idea</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                Full Name
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 h-12 bg-muted/50 border-border/50 focus:border-primary rounded-xl text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 bg-muted/50 border-border/50 focus:border-primary rounded-xl text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12 bg-muted/50 border-border/50 focus:border-primary rounded-xl text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl text-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Create account"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
