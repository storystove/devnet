"use client";

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X as LucideX, Brain, Loader2 } from 'lucide-react';
import { suggestTags, SuggestTagsInput } from '@/ai/flows/suggest-tags'; // Assuming server action
import { useToast } from '@/hooks/use-toast';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  contentForSuggestions?: string; // Text content to base AI suggestions on
}

export function TagInput({
  id,
  value = [],
  onChange,
  placeholder = "Add tags...",
  contentForSuggestions,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      addTag(inputValue.trim());
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    const newTag = tag.toLowerCase();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestTags = useCallback(async () => {
    if (!contentForSuggestions || contentForSuggestions.trim().length < 10) {
      toast({
        title: "Not enough content",
        description: "Please provide more content to generate tag suggestions.",
        variant: "default",
      });
      return;
    }
    setIsLoadingSuggestions(true);
    setSuggestedTags([]);
    try {
      const input: SuggestTagsInput = { content: contentForSuggestions };
      const result = await suggestTags(input);
      if (result && result.tags) {
        setSuggestedTags(result.tags.map(tag => tag.toLowerCase()));
        toast({ title: "Suggestions loaded!"});
      } else {
        toast({ title: "Could not get suggestions.", variant: "destructive"});
      }
    } catch (error) {
      console.error("Error suggesting tags:", error);
      toast({ title: "Error fetching suggestions", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [contentForSuggestions, toast]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="py-1 px-2 text-sm">
            {tag}
            <button
              type="button"
              className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              <LucideX className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="flex-grow"
        />
        {contentForSuggestions && (
          <Button type="button" variant="outline" onClick={handleSuggestTags} disabled={isLoadingSuggestions}>
            {isLoadingSuggestions ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Suggest</span>
          </Button>
        )}
      </div>
      {suggestedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <p className="text-sm text-muted-foreground w-full mb-1">Suggestions:</p>
          {suggestedTags.map(tag => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                addTag(tag);
                setSuggestedTags(prev => prev.filter(t => t !== tag));
              }}
              disabled={value.includes(tag)}
              className={value.includes(tag) ? "opacity-50 cursor-not-allowed" : ""}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
