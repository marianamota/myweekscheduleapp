import { useState } from 'react';
import { Star, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    toast.success('Thanks for your feedback! 🎉');
    setSubmitted(true);
    setTimeout(() => setOpen(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-card border rounded-xl shadow-xl p-4 mb-2 w-72 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-sm text-foreground">Rate this app</h4>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {submitted ? (
              <p className="text-sm text-center text-muted-foreground py-4">Thank you! ❤️</p>
            ) : (
              <>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className="w-7 h-7"
                        fill={(hover || rating) >= star ? 'hsl(var(--cat-5))' : 'transparent'}
                        stroke={(hover || rating) >= star ? 'hsl(var(--cat-5))' : 'hsl(var(--muted-foreground))'}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="text-sm resize-none h-20"
                />
                <Button size="sm" className="w-full" onClick={handleSubmit} disabled={rating === 0}>
                  Submit Feedback
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}
