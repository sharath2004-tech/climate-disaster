import { Footer } from "@/components/layout/Footer";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCommunityPosts } from "@/hooks/useAPI";
import { communityAPI } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Clock, HandHeart, Heart, Loader2, MapPin, MessageSquare, Package, Send, Users } from "lucide-react";
import { useState } from "react";

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

export default function CommunityPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'volunteer' | 'help'>('volunteer');
  const [volunteerForm, setVolunteerForm] = useState({
    name: "",
    phone: "",
    area: "",
    skills: "",
  });
  const [helpRequestForm, setHelpRequestForm] = useState({
    title: "",
    description: "",
    location: "",
    urgent: false,
  });

  const { data, isLoading, refetch } = useCommunityPosts({ limit: 20 });
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Use correct category names from model: 'help-needed' and 'help-offered'
  const helpRequests = (data?.posts || data || []).filter((p: any) => p.category === 'help-needed');
  const volunteerOffers = (data?.posts || data || []).filter((p: any) => p.category === 'help-offered');

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to register as a volunteer.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await communityAPI.create({
        category: 'help-offered', // Correct category from model
        title: `Volunteer: ${volunteerForm.name}`,
        content: `Skills: ${volunteerForm.skills}\nPhone: ${volunteerForm.phone}\nArea: ${volunteerForm.area}`,
        location: { 
          type: 'Point',
          coordinates: [0, 0], // Will be updated with real location
          address: volunteerForm.area 
        },
      });

      toast({
        title: "Thank you!",
        description: "You're now registered as a volunteer.",
      });

      setVolunteerForm({ name: "", phone: "", area: "", skills: "" });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      refetch();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not register. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle help request submission
  const handleHelpRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to submit a help request.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await communityAPI.create({
        category: 'help-needed', // Correct category from model
        title: helpRequestForm.title,
        content: helpRequestForm.description,
        location: { 
          type: 'Point',
          coordinates: [0, 0],
          address: helpRequestForm.location 
        },
        tags: helpRequestForm.urgent ? ['urgent'] : [],
      });

      toast({
        title: "Help request submitted",
        description: "Your request has been posted to the community.",
      });

      setHelpRequestForm({ title: "", description: "", location: "", urgent: false });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      refetch();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Could not submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfferHelp = async (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to offer help.",
        variant: "destructive",
      });
      return;
    }

    try {
      await communityAPI.comment(postId, { content: "I can help with this!" });
      toast({
        title: "Thank you!",
        description: "Your offer to help has been sent.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Could not submit. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarLayout>
      <main className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-fade-slide-in">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Community Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in delay-100">
              Community & Volunteers
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide-in delay-200">
              Join our community of volunteers and help those in need during emergencies
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <GlassCard className="text-center animate-fade-slide-in">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{volunteerOffers.length}</p>
              <p className="text-sm text-muted-foreground">Active Volunteers</p>
            </GlassCard>
            <GlassCard className="text-center animate-fade-slide-in" style={{ animationDelay: "100ms" }}>
              <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{helpRequests.length}</p>
              <p className="text-sm text-muted-foreground">Help Requests</p>
            </GlassCard>
            <GlassCard className="text-center animate-fade-slide-in" style={{ animationDelay: "200ms" }}>
              <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{(data?.posts || data || []).length}</p>
              <p className="text-sm text-muted-foreground">Community Posts</p>
            </GlassCard>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-4 mb-8 justify-center">
            <Button
              variant={activeTab === 'volunteer' ? 'default' : 'outline'}
              onClick={() => setActiveTab('volunteer')}
              className="flex items-center gap-2"
            >
              <HandHeart className="w-4 h-4" />
              Become a Volunteer
            </Button>
            <Button
              variant={activeTab === 'help' ? 'default' : 'outline'}
              onClick={() => setActiveTab('help')}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Request Help
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Forms Section */}
            {activeTab === 'volunteer' ? (
              <GlassCard className="animate-fade-slide-in delay-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <HandHeart className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Become a Volunteer</h2>
                </div>

                <form className="space-y-4" onSubmit={handleVolunteerSubmit}>
                  <Input 
                    placeholder="Your Name" 
                    className="bg-background/50"
                    value={volunteerForm.name}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                    required
                  />
                  <Input 
                    placeholder="Phone Number" 
                    className="bg-background/50"
                    value={volunteerForm.phone}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                    required
                  />
                  <Input 
                    placeholder="Your Area / Location" 
                    className="bg-background/50"
                    value={volunteerForm.area}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, area: e.target.value })}
                    required
                  />
                  <Textarea 
                    placeholder="Skills you can offer (e.g., First Aid, Driving, etc.)" 
                    className="bg-background/50"
                    value={volunteerForm.skills}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, skills: e.target.value })}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register as Volunteer"
                    )}
                  </Button>
                </form>
              </GlassCard>
            ) : (
              <GlassCard className="animate-fade-slide-in delay-300 border-orange-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Send className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Request Help</h2>
                </div>

                <form className="space-y-4" onSubmit={handleHelpRequestSubmit}>
                  <Input 
                    placeholder="What do you need help with?" 
                    className="bg-background/50"
                    value={helpRequestForm.title}
                    onChange={(e) => setHelpRequestForm({ ...helpRequestForm, title: e.target.value })}
                    required
                  />
                  <Textarea 
                    placeholder="Describe your situation in detail..." 
                    className="bg-background/50"
                    rows={4}
                    value={helpRequestForm.description}
                    onChange={(e) => setHelpRequestForm({ ...helpRequestForm, description: e.target.value })}
                    required
                  />
                  <Input 
                    placeholder="Your Location / Address" 
                    className="bg-background/50"
                    value={helpRequestForm.location}
                    onChange={(e) => setHelpRequestForm({ ...helpRequestForm, location: e.target.value })}
                    required
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={helpRequestForm.urgent}
                      onChange={(e) => setHelpRequestForm({ ...helpRequestForm, urgent: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">This is urgent</span>
                  </label>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Help Request
                      </>
                    )}
                  </Button>
                </form>
              </GlassCard>
            )}

              {/* Help Requests */}
              <GlassCard className="animate-fade-slide-in delay-400">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <MessageSquare className="w-5 h-5 text-warning" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Help Requests</h2>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : helpRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No help requests at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {helpRequests.slice(0, 5).map((request: any) => (
                      <div
                        key={request._id}
                        className={`p-4 rounded-lg border ${
                          request.urgent ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-foreground">{request.title}</h3>
                          {request.urgent && (
                            <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {request.location?.address || "Unknown location"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeAgo(request.createdAt)}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3"
                          onClick={() => handleOfferHelp(request._id)}
                        >
                          Offer Help
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => refetch()}
                >
                  Refresh Requests
                </Button>
              </GlassCard>
            </div>
          </div>
        </main>
        <Footer />
      </SidebarLayout>
  );
}
