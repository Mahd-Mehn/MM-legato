'use client';

import { useState } from 'react';
import { Lock, Gift, Coins, Star } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { PaymentGate, TippingInterface, CoinSpendingTracker } from '@/components/payment';

export default function PremiumDemoPage() {
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [showTippingInterface, setShowTippingInterface] = useState(false);
  const [contentUnlocked, setContentUnlocked] = useState(false);

  const handlePurchaseSuccess = () => {
    setContentUnlocked(true);
    setShowPaymentGate(false);
  };

  const handleTipSent = (amount: number) => {
    console.log(`Tip of ${amount} coins sent successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Premium Content Access Demo
          </h1>
          <p className="text-lg text-gray-600">
            Experience how payment gates, tipping, and coin spending work
          </p>
        </div>

        {/* Coin Spending Tracker */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Spending Overview</h2>
          <CoinSpendingTracker />
        </div>

        {/* Premium Content Example */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-600" />
              The Dragon's Tale - Chapter 12: The Final Battle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <img
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=200&fit=crop"
                alt="Story cover"
                className="w-24 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-gray-600 mb-4">
                  The epic conclusion to our hero's journey. In this thrilling final chapter, 
                  all secrets are revealed and the ultimate battle between good and evil takes place.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>by Sarah Johnson</span>
                  <span className="mx-2">•</span>
                  <span>4,200 words</span>
                  <span className="mx-2">•</span>
                  <span>⭐ 4.9 rating</span>
                </div>
                
                {contentUnlocked ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium mb-2">✅ Content Unlocked!</p>
                      <p className="text-gray-700">
                        The dragon's roar echoed through the mountains as our hero raised the ancient sword. 
                        The final battle had begun, and the fate of the kingdom hung in the balance. 
                        With courage in their heart and magic flowing through their veins, they charged forward...
                      </p>
                      <p className="text-gray-500 text-sm mt-2 italic">
                        [Full chapter content would continue here...]
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowTippingInterface(true)}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Tip Author
                      </Button>
                      <Button variant="outline">
                        Share Chapter
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg relative">
                      <div className="absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                          <Lock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-600 font-medium">Premium Content</p>
                          <p className="text-sm text-gray-500">Unlock to read the full chapter</p>
                        </div>
                      </div>
                      <p className="text-gray-400 blur-sm">
                        The dragon's roar echoed through the mountains as our hero raised the ancient sword. 
                        The final battle had begun, and the fate of the kingdom hung in the balance...
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Coins className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="font-semibold text-gray-900">25 coins</span>
                        <span className="text-gray-500 ml-2">to unlock</span>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setShowPaymentGate(true)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock Chapter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentGate(true)}
                fullWidth
              >
                <Lock className="w-4 h-4 mr-2" />
                Show Payment Gate
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowTippingInterface(true)}
                fullWidth
              >
                <Gift className="w-4 h-4 mr-2" />
                Show Tipping Interface
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setContentUnlocked(false);
                  setShowPaymentGate(false);
                  setShowTippingInterface(false);
                }}
                fullWidth
              >
                Reset Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Gate Modal */}
        {showPaymentGate && (
          <PaymentGate
            contentId="chapter-12"
            contentType="chapter"
            title="The Dragon's Tale - Chapter 12: The Final Battle"
            price={25}
            description="The epic conclusion to our hero's journey"
            authorId="author-sarah"
            authorName="Sarah Johnson"
            previewContent="The dragon's roar echoed through the mountains as our hero raised the ancient sword. The final battle had begun, and the fate of the kingdom hung in the balance..."
            onPurchaseSuccess={handlePurchaseSuccess}
            onClose={() => setShowPaymentGate(false)}
          />
        )}

        {/* Tipping Interface Modal */}
        {showTippingInterface && (
          <TippingInterface
            recipientId="author-sarah"
            recipientName="Sarah Johnson"
            contentId="chapter-12"
            contentTitle="The Dragon's Tale - Chapter 12"
            onTipSent={handleTipSent}
            onClose={() => setShowTippingInterface(false)}
          />
        )}
      </div>
    </div>
  );
}