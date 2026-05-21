"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Simple validation
    if (!name || !email || !subject || !message) {
      setError("Please fill out all fields.");
      setIsSubmitting(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { error: dbError } = await supabase
          .from("contact_submissions")
          .insert([{ name, email, subject, message }]);
        
        if (dbError) throw dbError;
      } else {
        // Fallback simulation if database credentials are not supplied
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      
      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Contact form submission error:", err);
      setError("Failed to send message. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground">Message Sent Successfully!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Thank you for contacting NSE Pulse. We have received your query and will get back to you within 24 to 48 business hours.
          </p>
        </div>
        <button
          onClick={() => setSubmitSuccess(false)}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 hover:shadow-blue-500/20 transition-all"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-500 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-55"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-55"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Feedback, Advertising, or Bug Report"
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-55"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
          Your Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-55 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 hover:shadow-blue-500/20 transition-all disabled:opacity-55 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Send Message</span>
          </>
        )}
      </button>
    </form>
  );
}
