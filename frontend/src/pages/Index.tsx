import Hero from "@/components/Hero";
import FarmerDashboard from "@/components/FarmerDashboard";
import Marketplace from "@/components/Marketplace";
import CarbonTracker from "@/components/CarbonTracker";
import FinancialTools from "@/components/FinancialTools";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <FarmerDashboard />
      <Marketplace />
      <CarbonTracker />
      <FinancialTools />
    </div>
  );
};

export default Index;
