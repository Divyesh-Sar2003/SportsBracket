import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BracketPreview = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-4">
            Interactive Tournament Brackets
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visualize and track tournament progress with our clean bracket system
          </p>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80">
            <CardTitle className="text-white">Sample Bracket - 8 Teams</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex justify-center items-center gap-8">
              {/* Quarter Finals */}
              <div className="space-y-8">
                <div className="text-xs text-muted-foreground mb-2">Quarter Finals</div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="border border-border rounded-lg px-4 py-3 bg-card hover:border-primary transition-colors cursor-pointer">
                      <div className="text-sm font-medium">Team {i * 2 - 1}</div>
                    </div>
                    <div className="border border-border rounded-lg px-4 py-3 bg-card hover:border-primary transition-colors cursor-pointer">
                      <div className="text-sm font-medium">Team {i * 2}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Semi Finals */}
              <div className="space-y-16">
                <div className="text-xs text-muted-foreground mb-2">Semi Finals</div>
                {[1, 2].map((i) => (
                  <div key={i} className="border border-border rounded-lg px-4 py-3 bg-muted hover:border-primary transition-colors cursor-pointer min-w-[120px]">
                    <div className="text-sm font-medium text-muted-foreground">Winner {i}</div>
                  </div>
                ))}
              </div>
              
              {/* Final */}
              <div className="space-y-8">
                <div className="text-xs text-muted-foreground mb-2">Final</div>
                <div className="border-2 border-accent rounded-lg px-4 py-3 bg-accent/5 hover:border-accent transition-colors cursor-pointer min-w-[120px]">
                  <div className="text-sm font-semibold text-accent">Champion</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Supports 8, 16, and 32 team brackets with automatic advancement
          </p>
        </div>
      </div>
    </section>
  );
};

export default BracketPreview;
