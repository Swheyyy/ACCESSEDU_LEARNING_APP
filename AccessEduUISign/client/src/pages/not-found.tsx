import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Hand, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-4" role="main">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Hand className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-xl font-semibold">Page Not Found</p>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.history.back()}
              data-testid="button-go-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Link href="/">
              <Button className="gap-2 w-full sm:w-auto" data-testid="button-go-home">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
