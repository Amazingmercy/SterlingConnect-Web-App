import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Clock } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  featureName: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({
  title,
  featureName,
  description,
}) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <Card className="p-10 space-y-5">
        <div className="w-12 h-12 rounded-full bg-sterling-purple-light text-sterling-purple mx-auto flex items-center justify-center">
          <Clock size={24} />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-sterling-purple">
            {featureName}
          </span>
          <h1 className="font-brand font-bold text-2xl sm:text-3xl text-sterling-navy">
            {title}
          </h1>
          <p className="text-xs text-sterling-muted max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>
        <div className="pt-4">
          <Link to="/">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={14} />}>
              Return Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
