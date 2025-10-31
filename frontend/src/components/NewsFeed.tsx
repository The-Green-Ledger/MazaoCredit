import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type NewsItem = {
  title: string;
  url: string;
  source?: string;
  published?: string;
  excerpt?: string;
};

const fallbackNews: NewsItem[] = [
  {
    title: "Rainfall outlook and planting advisory for smallholders",
    url: "https://example.com/advisory",
    source: "Sprout News",
    published: new Date().toISOString(),
    excerpt: "Upcoming rains expected to be moderate. Consider early-maturing varieties and soil moisture conservation.",
  },
  {
    title: "Market prices: Maize and beans update",
    url: "https://example.com/markets",
    source: "Sprout Markets",
    published: new Date().toISOString(),
    excerpt: "Maize prices stable; beans up 3% week-over-week in regional markets.",
  }
];

const NewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>(fallbackNews);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // Prefer Supabase community_news in English
        const { data, error } = await supabase
          .from('community_news')
          .select('title,url,source,published,excerpt,language')
          .eq('language', 'en')
          .order('published', { ascending: false })
          .limit(12);
        if (!error && data && data.length) {
          setNews(
            data.map((n: any) => ({
              title: n.title,
              url: n.url || '#',
              source: n.source || 'Sprout News',
              published: n.published,
              excerpt: n.excerpt || '',
            }))
          );
          return;
        }
        // Fallback: English static list
        setNews(fallbackNews);
      } catch {
        setNews(fallbackNews);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Community News</CardTitle>
        <CardDescription>Agriculture updates and insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((n, i) => (
            <div key={i} className="p-3 border rounded-lg bg-background">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-foreground">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {n.source || "News"} · {new Date(n.published || "").toLocaleString()}
                  </div>
                  {!!n.excerpt && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.excerpt}</div>
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={n.url} target="_blank" rel="noreferrer">Read</a>
                </Button>
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-muted-foreground">Loading news...</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsFeed;


