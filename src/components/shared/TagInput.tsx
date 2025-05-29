
"use client";

import React, { useState, useCallback, ChangeEvent, KeyboardEvent } from 'react'; // Added explicit types
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X as LucideX, Brain, Loader2 } from 'lucide-react';
import { suggestTags, SuggestTagsInput } from '@/ai/flows/suggest-tags';
import { useToast } from '@/hooks/use-toast';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  contentForSuggestions?: string;
}

// Wrap TagInput with React.memo
const TagInputComponent = ({
  id,
  value = [],
  onChange,
  placeholder = "Add tags...",
  contentForSuggestions,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      addTag(inputValue.trim());
      setInputValue('');
      // Clear suggestions after adding a tag from input
      if (suggestedTags.length > 0) setSuggestedTags([]);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const addTag = useCallback((tag: string) => {
    const newTag = tag.toLowerCase().trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
  }, [value, onChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  }, [value, onChange]);

  const handleSuggestTags = useCallback(async () => {
    if (!contentForSuggestions || contentForSuggestions.trim().length < 10) {
      toast({
        title: "Not enough content",
        description: "Please provide more content (at least 10 characters) to generate tag suggestions.",
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
        // Filter out tags already present in the main value array
        const newSuggestions = result.tags
          .map(tag => tag.toLowerCase().trim())
          .filter(tag => tag && !value.includes(tag));
        setSuggestedTags(newSuggestions);
        if (newSuggestions.length > 0) {
            toast({ title: "Suggestions loaded!"});
        } else if (result.tags.length > 0) {
            toast({ title: "Suggestions loaded (already added or similar)." });
        } else {
            toast({ title: "No new suggestions found."});
        }
      } else {
        toast({ title: "Could not get suggestions.", variant: "destructive"});
      }
    } catch (error) {
      console.error("Error suggesting tags:", error);
      toast({ title: "Error fetching suggestions", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [contentForSuggestions, toast, value]); // Added value to dependencies of handleSuggestTags

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="py-1 px-2 text-sm">
            {tag}
            <button
              type="button"
              className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
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
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-1">Suggestions (click to add):</p>
          <div className="flex flex-wrap gap-1.5">
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
                className="text-xs"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TagInput = React.memo(TagInputComponent);
