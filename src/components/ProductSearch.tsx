import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductSearchProps {
  onSearch: (articleNumber: string) => void;
  isLoading: boolean;
}

export const ProductSearch = ({ onSearch, isLoading }: ProductSearchProps) => {
  const [articleNumber, setArticleNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (articleNumber.trim()) {
      onSearch(articleNumber.trim());
    }
  };

  // Auto-search when user types enough characters
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setArticleNumber(value);
    
    // Auto-search when user has typed at least 5 characters
    if (value.length >= 5 && !isLoading) {
      onSearch(value.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sök produkt</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Ange artikelnummer (t.ex. 1914706)"
            value={articleNumber}
            onChange={handleInputChange}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Söker...' : 'Sök'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};