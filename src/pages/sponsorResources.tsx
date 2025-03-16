import React, { useState, useEffect } from "react";
import { useResource } from "../hooks/useResource";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Spinner } from "../components/ui/spinner";
import { Badge } from "../components/ui/badge";

const SponsorResources: React.FC = () => {
    const {
        getSponsorResources,
        bookmarkResource,
        downloadResource,
        isLoading
    } = useResource();

    const [resources, setResources] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const data = await getSponsorResources();
                setResources(data || []);
            } catch (error) {
                console.error("Failed to fetch sponsor resources:", error);
            }
        };

        fetchResources();
    }, [getSponsorResources]);

    const handleBookmark = async (resourceId: string) => {
        try {
            await bookmarkResource(resourceId);
            // Update local state to reflect the bookmark
            setResources(resources.map(resource =>
                resource.id === resourceId
                    ? { ...resource, isBookmarked: !resource.isBookmarked }
                    : resource
            ));
        } catch (error) {
            console.error("Failed to bookmark resource:", error);
        }
    };

    const handleDownload = async (resourceId: string, filename: string) => {
        try {
            await downloadResource(resourceId);
            // In a real implementation, this would trigger a file download
            console.log(`Downloading ${filename}...`);
        } catch (error) {
            console.error("Failed to download resource:", error);
        }
    };

    // Filter resources based on search query and active category
    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource?.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "all" || resource?.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Categories for the tabs
    const categories = ["all", "mentoring", "training", "guides", "templates", "research"];

    return (
        <Container className="py-10">
            <Heading level="h1" className="mb-6">Sponsor Resources</Heading>
            <Text className="mb-8">
                Access exclusive resources designed to support your role as a sponsor. These materials
                will help you provide effective mentorship and guidance to your mentees.
            </Text>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="md:max-w-xs"
                />
                <div className="flex-1" />
                <Button variant="outline">My Bookmarks</Button>
                <Button variant="outline">Recently Added</Button>
            </div>

            <Tabs
                defaultValue="all"
                onValueChange={setActiveCategory}
                className="w-full"
            >
                <TabsList className="mb-6">
                    {categories.map((category) => (
                        <TabsTrigger
                            key={category}
                            value={category}
                            className="capitalize"
                        >
                            {category === "all" ? "All Resources" : category}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map((category) => (
                    <TabsContent key={category} value={category}>
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Spinner size="lg" />
                            </div>
                        ) : filteredResources.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Placeholder resource cards */}
                                {[1, 2, 3, 4, 5, 6].map((item) => {
                                    const resourceType = ["guide", "video", "pdf", "template"][item % 4];
                                    const isBookmarked = item % 3 === 0;

                                    return (
                                        <Card key={item} className="flex flex-col h-full">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="mr-2">Sponsor Resource {item}</CardTitle>
                                                    <Badge variant={resourceType === "pdf" ? "destructive" :
                                                        resourceType === "video" ? "secondary" :
                                                            "default"}>
                                                        {resourceType}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <Text className="mb-4">
                                                    This is a placeholder for a {category === "all" ? "resource" : category.slice(0, -1)}
                                                    that provides guidance for sponsors on effective mentoring techniques.
                                                </Text>
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Added: {new Date().toLocaleDateString()}</span>
                                                    <span>Views: {item * 15}</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="border-t pt-4 flex justify-between">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleBookmark(`resource-${item}`)}
                                                >
                                                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(`resource-${item}`, `sponsor-resource-${item}.${resourceType === "pdf" ? "pdf" : resourceType === "video" ? "mp4" : "docx"}`)}
                                                >
                                                    Download
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Text>No resources found in this category.</Text>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            <div className="mt-12 border-t pt-8">
                <Heading level="h2" className="mb-4">Submit a Resource</Heading>
                <Text className="mb-6">
                    Have a valuable resource that could help other sponsors? Submit it for review by our team.
                </Text>
                <Button>Submit Resource</Button>
            </div>
        </Container>
    );
};

export default SponsorResources; 