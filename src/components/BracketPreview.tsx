import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Swords } from "lucide-react";

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

        <Card className="overflow-hidden border-none shadow-2xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary via-primary/80 to-secondary text-white border-b border-primary/10">
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
              Sample Tournament - 8 Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              <div className="min-w-[800px] p-8 flex justify-center items-center gap-12 lg:gap-20">
                {/* Quarter Finals */}
                <div className="space-y-12 relative">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Quarter Finals
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-3 relative group">
                      <div className="border border-border/50 rounded-xl px-4 py-3 bg-card/80 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer min-w-[160px] relative z-10">
                        <div className="text-sm font-semibold flex justify-between items-center">
                          <span>Team {i * 2 - 1}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded">R1</span>
                        </div>
                      </div>
                      <div className="border border-border/50 rounded-xl px-4 py-3 bg-card/80 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer min-w-[160px] relative z-10">
                        <div className="text-sm font-semibold flex justify-between items-center">
                          <span>Team {i * 2}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded">R1</span>
                        </div>
                      </div>
                      {/* Connection Lines */}
                      <div className="absolute top-1/2 -right-6 w-6 h-px bg-border group-hover:bg-primary/30 transition-colors"></div>
                    </div>
                  ))}
                </div>

                {/* Semi Finals */}
                <div className="space-y-24">
                  <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Semi Finals
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="border-2 border-dashed border-border/50 rounded-xl px-4 py-4 bg-muted/30 hover:border-secondary/50 transition-all duration-300 cursor-pointer min-w-[180px] group relative">
                      <div className="text-sm font-bold text-muted-foreground flex items-center justify-between">
                        <span>Winner Match {i}</span>
                        <Swords className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:text-secondary transition-all" />
                      </div>
                      {/* Connection Lines */}
                      <div className="absolute top-1/2 -left-6 w-6 h-px bg-border"></div>
                      <div className="absolute top-1/2 -right-6 w-6 h-px bg-border group-hover:bg-secondary/30 transition-colors"></div>
                    </div>
                  ))}
                </div>

                {/* Final */}
                <div className="space-y-8">
                  <div className="text-xs font-bold uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full"></span>
                    Grand Finals
                  </div>
                  <div className="border-2 border-accent rounded-2xl px-6 py-6 bg-accent/5 hover:bg-accent/10 hover:shadow-xl hover:shadow-accent/10 transition-all duration-500 cursor-pointer min-w-[200px] text-center group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                      <Trophy className="w-12 h-12 text-accent" />
                    </div>
                    <div className="text-lg font-bold text-accent mb-1 drop-shadow-sm">Champion</div>
                    <div className="text-xs text-accent/60 font-medium">Tournament Winner</div>
                    {/* Connection Lines */}
                    <div className="absolute top-1/2 -left-8 w-8 h-px bg-accent/30"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile Scroll Indicator */}
            <div className="md:hidden text-center py-2 bg-muted/20 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="animate-pulse">←</span> Swipe to explore bracket <span className="animate-pulse">→</span>
              </p>
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
