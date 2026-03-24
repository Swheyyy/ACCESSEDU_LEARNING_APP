import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAccessibility } from "@/lib/accessibility-context";
import { Eye, Type, Sun, Moon, Volume2, Hand, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function ElderlyDashboard() {
    const { settings, setFontSize, toggleHighContrast } = useAccessibility();
    const [, setLocation] = useLocation();
    const [textSize, setTextSize] = useState([parseInt(settings.fontSize)]);

    const handleFontSizeChange = (value: number[]) => {
        setTextSize(value);
        setFontSize(value[0].toString() as "100" | "125" | "150");
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-background">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Welcome to AccessEdu
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Adjust the settings below to make the screen easier to see and use.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Accessibility Controls */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Eye className="w-8 h-8 text-primary" />
                                Visual Settings
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Customize how the screen looks for you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xl font-medium flex items-center gap-2">
                                        <Type className="w-6 h-6" />
                                        Text Size
                                    </Label>
                                    <span className="text-lg font-bold">{textSize}%</span>
                                </div>
                                <Slider
                                    value={textSize}
                                    min={100}
                                    max={150}
                                    step={25}
                                    onValueChange={handleFontSizeChange}
                                    className="py-4"
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Normal</span>
                                    <span>Large</span>
                                    <span>Extra Large</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between space-x-4">
                                <Label htmlFor="high-contrast" className="flex flex-col space-y-1">
                                    <span className="text-xl font-medium flex items-center gap-2">
                                        <Sun className="w-6 h-6" />
                                        High Contrast
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Make text stand out more clearly
                                    </span>
                                </Label>
                                <Switch
                                    id="high-contrast"
                                    checked={settings.highContrast}
                                    onCheckedChange={toggleHighContrast}
                                    className="scale-150"
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-4">
                                <Label htmlFor="text-to-speech" className="flex flex-col space-y-1">
                                    <span className="text-xl font-medium flex items-center gap-2">
                                        <Volume2 className="w-6 h-6" />
                                        Read Text Aloud
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Hear descriptions of what's on screen
                                    </span>
                                </Label>
                                <Switch
                                    id="text-to-speech"
                                    className="scale-150"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Action */}
                    <Card className="border-2 border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Hand className="w-8 h-8 text-primary" />
                                Start Learning
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Begin your sign language journey.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-lg leading-relaxed">
                                Our sign language recognition tool is ready for you. It uses large, clear visuals and simple controls.
                            </p>
                            <Button
                                size="lg"
                                className="w-full text-xl py-8 h-auto"
                                onClick={() => setLocation("/recognize")}
                            >
                                Go to Recognition Tool
                                <ArrowRight className="ml-3 w-6 h-6" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
