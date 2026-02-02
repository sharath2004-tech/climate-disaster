import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BookOpen, CheckCircle, Droplets, Flame, Play, Trophy, Wind } from "lucide-react";

const courses = [
  {
    id: 1,
    title: "Flood Safety Basics",
    icon: Droplets,
    lessons: 5,
    completed: 3,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 2,
    title: "Heatwave Preparedness",
    icon: Flame,
    lessons: 4,
    completed: 4,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: 3,
    title: "Cyclone & Storm Safety",
    icon: Wind,
    lessons: 6,
    completed: 0,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    id: 4,
    title: "Emergency First Aid",
    icon: AlertTriangle,
    lessons: 8,
    completed: 2,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

const dosAndDonts = [
  {
    category: "During Floods",
    dos: ["Move to higher ground", "Turn off electricity", "Keep emergency kit ready"],
    donts: ["Don't walk in moving water", "Don't drive through flooded roads", "Don't touch electrical equipment"],
  },
  {
    category: "During Heatwaves",
    dos: ["Stay hydrated", "Stay indoors during peak hours", "Wear light clothing"],
    donts: ["Don't leave children in cars", "Don't overexert", "Don't ignore heat symptoms"],
  },
];

export default function LearnPage() {
  return (
    <SidebarLayout>
      <main className="min-h-screen py-8 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-fade-slide-in">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Education Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in delay-100">
              Learn & Train
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide-in delay-200">
              Build your disaster preparedness skills with interactive courses and quizzes
            </p>
          </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {courses.map((course, index) => {
                const Icon = course.icon;
                const progress = (course.completed / course.lessons) * 100;
                
                return (
                  <GlassCard
                    key={course.id}
                    hover
                    className="animate-fade-slide-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`p-3 rounded-xl ${course.bgColor} w-fit mb-4`}>
                      <Icon className={`w-6 h-6 ${course.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.completed} of {course.lessons} lessons completed
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress === 100 ? "bg-success" : "bg-primary"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <Button
                      className="w-full gap-2"
                      variant={progress === 100 ? "outline" : "default"}
                    >
                      {progress === 100 ? (
                        <>
                          <Trophy className="w-4 h-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Continue
                        </>
                      )}
                    </Button>
                  </GlassCard>
                );
              })}
            </div>

            {/* Do's and Don'ts */}
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Do's & Don'ts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dosAndDonts.map((item, index) => (
                <GlassCard key={index} className="animate-fade-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{item.category}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-success mb-2">✓ Do's</p>
                      <ul className="space-y-2">
                        {item.dos.map((d, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-destructive mb-2">✗ Don'ts</p>
                      <ul className="space-y-2">
                        {item.donts.map((d, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </main>
      </SidebarLayout>
    );
}
