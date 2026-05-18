import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Architectures } from "@/components/Architectures";
import { Projects } from "@/components/Projects";
import { Certifications } from "@/components/Certifications";
import { Education } from "@/components/Education";
import { TechStack } from "@/components/TechStack";
import { Contact, Footer } from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Architectures />
        <Projects />
        <Certifications />
        <Education />
        <TechStack />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
