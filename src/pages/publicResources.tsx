import React from "react";
import { useResource } from "../hooks/useResource";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Spinner } from "../components/ui/spinner";

const PublicResources: React.FC = () => {
  const { getPublicResources, isLoading } = useResource();
  const [resources, setResources] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getPublicResources();
        setResources(data || []);
      } catch (error) {
        console.error("Failed to fetch public resources:", error);
      }
    };

    fetchResources();
  }, [getPublicResources]);

  // Placeholder categories for the tabs
  const categories = ["All", "Articles", "Videos", "Podcasts", "Guides"];

  return (
    <Container className="py-10">
      <Heading level="h1" className="mb-6">Public Resources</Heading>
      <Text className="mb-8">
        Explore our collection of publicly available resources designed to provide information,
        support, and guidance. These resources are accessible to everyone, whether you're a
        registered member or just visiting.
      </Text>

      <Tabs defaultValue="All" className="w-full">
        <TabsList className="mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder resource cards */}
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Card key={item} className="h-full">
                    <CardHeader>
                      <CardTitle>Resource {item}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="mb-4">
                        This is a placeholder for a {category === "All" ? "resource" : category.toLowerCase().slice(0, -1)} 
                        that provides valuable information and support.
                      </Text>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString()}
                        </span>
                        <a 
                          href="#" 
                          className="text-primary hover:underline"
                        >
                          Read More
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Text>No resources found in this category.</Text>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Container>
  );
};

export default PublicResources; 