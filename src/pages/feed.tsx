import React, { useState, useEffect } from "react";
import { usePost } from "../hooks/usePost";
import { useUser } from "../hooks/useUser";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Card, CardContent, CardHeader, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Avatar } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Spinner } from "../components/ui/spinner";

const Feed: React.FC = () => {
    const { user } = useUser();
    const { getPosts, createPost, likePost, commentOnPost, isLoading } = usePost();
    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getPosts();
                setPosts(data || []);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            }
        };

        fetchPosts();
    }, [getPosts]);

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;

        try {
            await createPost({ content: newPostContent });
            setNewPostContent("");
            // Refetch posts after creating a new one
            const data = await getPosts();
            setPosts(data || []);
        } catch (error) {
            console.error("Failed to create post:", error);
        }
    };

    const handleLikePost = async (postId: string) => {
        try {
            await likePost(postId);
            // Update the post in the local state
            setPosts(posts.map(post =>
                post.id === postId
                    ? { ...post, likes: [...post.likes, user?.id], likeCount: post.likeCount + 1 }
                    : post
            ));
        } catch (error) {
            console.error("Failed to like post:", error);
        }
    };

    return (
        <Container className="py-10">
            <Heading level="h1" className="mb-6">Your Feed</Heading>

            {/* Post creation card */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <Avatar
                            src={user?.profilePicture || ""}
                            alt={user?.username || "User"}
                            fallback={user?.username?.[0]?.toUpperCase() || "U"}
                        />
                        <div className="flex-1">
                            <Textarea
                                placeholder="What's on your mind?"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                className="mb-4"
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                                    Post
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Feed tabs */}
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="all">All Posts</TabsTrigger>
                    <TabsTrigger value="following">Following</TabsTrigger>
                    <TabsTrigger value="groups">Support Groups</TabsTrigger>
                </TabsList>

                {["all", "following", "groups"].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Placeholder posts */}
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <Card key={item} className="overflow-hidden">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={`U${item}`}
                                                />
                                                <div>
                                                    <div className="font-medium">User {item}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {new Date().toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-4">
                                            <p>
                                                This is a placeholder post for the {tab} feed. It contains content that would
                                                typically be shared by users on the platform.
                                            </p>
                                            {item % 2 === 0 && (
                                                <div className="mt-4 bg-muted h-48 rounded-md flex items-center justify-center">
                                                    <span className="text-muted-foreground">Post Image Placeholder</span>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="border-t pt-4 flex justify-between">
                                            <Button variant="ghost" size="sm" onClick={() => handleLikePost(`post-${item}`)}>
                                                Like • {item * 5}
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                Comment • {item * 3}
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                Share
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </Container>
    );
};

export default Feed; 