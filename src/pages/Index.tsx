import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import GamesSection from "@/components/GamesSection";
import BracketPreview from "@/components/BracketPreview";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <GamesSection />
      <BracketPreview />
      <Footer />
    </div>
  );
};

export default Index;
