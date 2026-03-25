import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Hand, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-dashed border-muted shadow-lg">
        <CardContent className="pt-8 pb-10 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center animate-bounce">
            <Hand className="h-10 w-10 text-yellow-600" aria-hidden="true" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">404</h1>
            <p className="text-xl font-medium text-muted-foreground">Page Not Found</p>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link href="/">
            <Button className="w-full gap-2" size="lg">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
