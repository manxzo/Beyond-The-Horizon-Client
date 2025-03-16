import { useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Spinner,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Input,
  Textarea,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
} from "@heroui/react";
import {
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  Clock,
  UserPlus,
  Heart,
  Send,
  MoreVertical,
  ThumbsUp,
  Edit,
  Trash,
  RefreshCw,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useSupportGroup } from "../hooks/useSupportGroup";
import { usePost } from "../hooks/usePost";
import { useUser } from "../hooks/useUser";
import { useState, useRef, useEffect } from "react";
import { postService, userService } from "../services/services";

// Define types for our data structures
interface PostAuthor {
  username: string;
  avatar_url: string;
  user_id: string;
}

interface PostLike {
  user_id: string;
  post_id: string;
}

interface Comment {
  comment_id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  author?: PostAuthor;
}

interface Post {
  post: {
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    tags: string[];
  };
  likes: PostLike[];
  comments: Comment[];
  like_count: number;
  author?: PostAuthor;
}

interface PostsPage {
  posts: Post[];
  page: number;
  posts_per_page: number;
  total_count: number;
}

export default function Feed() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTags, setSearchTags] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Get support group hooks
  const { getMyGroups } = useSupportGroup();

  // Get user hooks
  const { currentUser, useGetUserById } = useUser();

  // Get post hooks
  const {
    getPosts,
    getPost,
    createPost,
    isCreatingPost,
    updatePost,
    isUpdatingPost,
    deletePost,
    isDeletingPost,
    likePost,
    isLikingPost,
    commentOnPost,
    isCommentingOnPost,
    updateComment,
    isUpdatingComment,
    deleteComment,
    isDeletingComment,
  } = usePost();

  // Fetch posts with pagination
  const {
    data: postsResponse,
    isLoading: isLoadingPosts,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchPosts,
  } = useInfiniteQuery({
    queryKey: ['posts', 'filtered', page, searchTags, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        // Call the postService directly
        const response = await postService.getPosts(pageParam, searchTags, sortBy);
        return response.data;
      } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage: PostsPage) => {
      const totalPages = Math.ceil(lastPage.total_count / lastPage.posts_per_page);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // Fetch my support groups using the hook
  const {
    data: myGroupsResponse,
    isLoading: isLoadingMyGroups,
    error: myGroupsError,
  } = useQuery(getMyGroups());

  // Extract the actual data from the response
  const myGroups = myGroupsResponse?.data || [];

  // Process posts to include author data
  const [postsWithAuthors, setPostsWithAuthors] = useState<Post[]>([]);

  // Create a function to get user data that doesn't use hooks directly
  const fetchUserData = async (userId: string) => {
    try {
      // Make a direct API call to get user data using the service
      const response = await userService.getUserById(userId);
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  // Process posts to include author data
  useEffect(() => {
    if (!postsResponse?.pages) return;

    const fetchAuthors = async () => {
      const allPosts: Post[] = [];

      for (const page of postsResponse.pages) {
        for (const post of page.posts) {
          // Get author data for the post
          const authorData = await fetchUserData(post.post.author_id);
          const postWithAuthor = {
            ...post,
            author: authorData
          };

          // Get author data for all comments
          const commentsWithAuthors = await Promise.all(
            post.comments.map(async (comment) => {
              const commentAuthorData = await fetchUserData(comment.author_id);
              return {
                ...comment,
                author: commentAuthorData
              };
            })
          );

          postWithAuthor.comments = commentsWithAuthors;
          allPosts.push(postWithAuthor);
        }
      }

      setPostsWithAuthors(allPosts);
    };

    fetchAuthors();
  }, [postsResponse]);

  // Handle navigating to a support group's dashboard
  const handleViewGroup = (groupId: string) => {
    navigate(`/support-groups/${groupId}`);
  };

  // Handle navigating to the support groups page
  const handleViewAllGroups = () => {
    navigate('/support-groups');
  };

  // Handle creating a new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const tags = newPostTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    await createPost({
      content: newPostContent,
      tags: tags.length > 0 ? tags : undefined,
    });

    setNewPostContent("");
    setNewPostTags("");
    refetchPosts();
  };

  // Handle liking a post
  const handleLikePost = async (postId: string) => {
    await likePost(postId);
  };

  // Handle commenting on a post
  const handleComment = async (postId: string, parentCommentId?: string) => {
    if (!commentContent.trim()) return;

    await commentOnPost({
      postId,
      content: commentContent,
      parentCommentId,
    });

    setCommentContent("");
    setReplyingTo(null);
  };

  // Handle updating a post
  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;

    await updatePost({
      postId,
      postData: { content: editContent },
    });

    setEditingPost(null);
    setEditContent("");
  };

  // Handle updating a comment
  const handleUpdateComment = async (commentId: string, postId: string) => {
    if (!editContent.trim()) return;

    await updateComment({
      commentId,
      content: editContent,
      postId,
    });

    setEditingComment(null);
    setEditContent("");
  };

  // Handle deleting a post
  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      await deletePost(postId);
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteComment({
        commentId,
        postId,
      });
    }
  };

  // Toggle expanded comments for a post
  const toggleExpandComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Render nested comments recursively
  const renderComments = (comments: Comment[], postId: string, parentId: string | null = null) => {
    const filteredComments = comments.filter(
      comment => comment.parent_comment_id === parentId
    );

    if (filteredComments.length === 0) return null;

    return (
      <div className={`space-y-3 ${parentId ? 'ml-6 border-l-2 border-default-200 pl-3' : ''}`}>
        {filteredComments.map(comment => {
          const isAuthor = currentUser?.user_id === comment.author_id;
          const childComments = comments.filter(
            c => c.parent_comment_id === comment.comment_id
          );

          return (
            <div key={comment.comment_id} className="bg-default-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Avatar
                  src={comment.author?.avatar_url}
                  name={(comment.author?.username || "U").charAt(0).toUpperCase()}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold">{comment.author?.username || "User"}</span>
                      <span className="text-xs text-default-400 ml-2">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {isAuthor && (
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Comment actions">
                          <DropdownItem
                            key="edit-comment"
                            startContent={<Edit size={16} />}
                            onPress={() => {
                              setEditingComment(comment.comment_id);
                              setEditContent(comment.content);
                            }}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            key="delete-comment"
                            startContent={<Trash size={16} />}
                            className="text-danger"
                            onPress={() => handleDeleteComment(comment.comment_id, postId)}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    )}
                  </div>

                  {editingComment === comment.comment_id ? (
                    <div className="mt-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Edit your comment..."
                        className="w-full"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => {
                            setEditingComment(null);
                            setEditContent("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => handleUpdateComment(comment.comment_id, postId)}
                          isLoading={isUpdatingComment}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm mt-1">{comment.content}</p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => {
                        setReplyingTo(comment.comment_id);
                        setCommentContent("");
                      }}
                    >
                      Reply
                    </Button>
                  </div>

                  {replyingTo === comment.comment_id && (
                    <div className="mt-2">
                      <Input
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Write a reply..."
                        endContent={
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleComment(postId, comment.comment_id)}
                            isLoading={isCommentingOnPost}
                          >
                            <Send size={16} />
                          </Button>
                        }
                      />
                    </div>
                  )}

                  {childComments.length > 0 && renderComments(comments, postId, comment.comment_id)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render post cards
  const renderPosts = () => {
    if (postsWithAuthors.length === 0) return null;

    return postsWithAuthors.map(post => {
      const isAuthor = currentUser?.user_id === post.post.author_id;
      const isLiked = post.likes.some(like => like.user_id === currentUser?.user_id);
      const isExpanded = expandedComments.has(post.post.post_id);

      return (
        <Card key={post.post.post_id} className="mb-4">
          <CardHeader className="flex gap-3">
            <Avatar
              src={post.author?.avatar_url}
              name={(post.author?.username || "U").charAt(0).toUpperCase()}
              size="md"
            />
            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-md font-semibold">{post.author?.username || "User"}</p>
                  <p className="text-small text-default-500">
                    {formatDate(post.post.created_at)}
                  </p>
                </div>
                {isAuthor && (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Post actions">
                      <DropdownItem
                        key="edit-post"
                        startContent={<Edit size={16} />}
                        onPress={() => {
                          setEditingPost(post.post.post_id);
                          setEditContent(post.post.content);
                        }}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        key="delete-post"
                        startContent={<Trash size={16} />}
                        className="text-danger"
                        onPress={() => handleDeletePost(post.post.post_id)}
                      >
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                )}
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            {editingPost === post.post.post_id ? (
              <div>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your post..."
                  className="w-full"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    onPress={() => {
                      setEditingPost(null);
                      setEditContent("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => handleUpdatePost(post.post.post_id)}
                    isLoading={isUpdatingPost}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{post.post.content}</p>
                {post.post.tags && post.post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.post.tags.map((tag: string, index: number) => (
                      <Chip key={index} size="sm" variant="flat" color="primary">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardBody>
          <Divider />
          <CardFooter className="flex flex-col gap-3">
            <div className="flex justify-between w-full">
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant={isLiked ? "solid" : "light"}
                  color={isLiked ? "primary" : "default"}
                  startContent={<ThumbsUp size={16} />}
                  onPress={() => handleLikePost(post.post.post_id)}
                  isLoading={isLikingPost}
                >
                  {post.like_count} {post.like_count === 1 ? "Like" : "Likes"}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  startContent={<MessageSquare size={16} />}
                  onPress={() => toggleExpandComments(post.post.post_id)}
                >
                  {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
                </Button>
              </div>
            </div>

            {isExpanded && (
              <>
                <Divider />
                <div className="w-full">
                  <Input
                    value={replyingTo === null ? commentContent : ""}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    endContent={
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleComment(post.post.post_id)}
                        isLoading={isCommentingOnPost}
                      >
                        <Send size={16} />
                      </Button>
                    }
                  />

                  {post.comments.length > 0 && (
                    <div className="mt-3">
                      {renderComments(post.comments, post.post.post_id)}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardFooter>
        </Card>
      );
    });
  };

  if (isLoadingPosts && isLoadingMyGroups) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <Spinner size="lg" color="primary" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Feed</h1>
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="flat"
              startContent={<Users size={18} />}
              onPress={handleViewAllGroups}
            >
              View All Support Groups
            </Button>
          </div>
        </div>

        <Tabs aria-label="Feed Tabs">
          <Tab key="feed" title={
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <span>Feed</span>
            </div>
          }>
            <div className="mt-6">
              <Card className="mb-6">
                <CardBody>
                  <form onSubmit={handleCreatePost}>
                    <Textarea
                      placeholder="What&apos;s on your mind?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      minRows={3}
                      className="mb-3"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Tags (comma separated)"
                        value={newPostTags}
                        onChange={(e) => setNewPostTags(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        color="primary"
                        type="submit"
                        isLoading={isCreatingPost}
                        isDisabled={!newPostContent.trim()}
                      >
                        Post
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 items-center">
                  <span className="text-default-500">Sort by:</span>
                  <Button
                    variant={sortBy === "latest" ? "solid" : "flat"}
                    color={sortBy === "latest" ? "primary" : "default"}
                    size="sm"
                    onPress={() => setSortBy("latest")}
                  >
                    Latest
                  </Button>
                  <Button
                    variant={sortBy === "most-liked" ? "solid" : "flat"}
                    color={sortBy === "most-liked" ? "primary" : "default"}
                    size="sm"
                    onPress={() => setSortBy("most-liked")}
                  >
                    Most Liked
                  </Button>
                </div>
                <Button
                  variant="light"
                  startContent={<RefreshCw size={16} />}
                  onPress={() => refetchPosts()}
                  isLoading={isLoadingPosts}
                  size="sm"
                >
                  Refresh
                </Button>
              </div>

              {postsError ? (
                <Card className="p-6 text-center">
                  <CardBody className="flex flex-col items-center">
                    <p className="text-danger">Error loading posts. Please try again.</p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  {renderPosts()}

                  {hasNextPage && (
                    <div className="flex justify-center mt-4 mb-8">
                      <Button
                        variant="flat"
                        color="primary"
                        onPress={() => fetchNextPage()}
                        isLoading={isFetchingNextPage}
                      >
                        Load More
                      </Button>
                    </div>
                  )}

                  {postsWithAuthors.length === 0 && !isLoadingPosts && (
                    <Card className="p-6 text-center">
                      <CardBody className="flex flex-col items-center">
                        <MessageSquare size={48} className="text-default-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No posts yet</h3>
                        <p className="text-default-500 mb-6">Be the first to share something with the community!</p>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}
            </div>
          </Tab>

          <Tab key="groups" title={
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>My Groups</span>
            </div>
          }>
            <div className="mt-6">
              {myGroups && myGroups.length > 0 ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users size={20} />
                    Your Support Groups
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myGroups.map((group: any) => (
                      <Card
                        key={group.support_group_id}
                        isPressable
                        onPress={() => handleViewGroup(group.support_group_id)}
                        className="border border-default-200 hover:border-primary transition-all"
                      >
                        <CardHeader className="flex gap-3">
                          <div className="flex flex-col">
                            <p className="text-lg font-semibold">{group.title}</p>
                            <p className="text-small text-default-500">
                              Joined on {new Date(group.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <p className="line-clamp-2">{group.description}</p>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <Button
                            color="primary"
                            variant="flat"
                            fullWidth
                            onPress={() => handleViewGroup(group.support_group_id)}
                          >
                            View Group
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <CardBody className="flex flex-col items-center">
                    <Users size={48} className="text-default-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">You haven&apos;t joined any support groups yet</h3>
                    <p className="text-default-500 mb-6">Join a group to connect with others and participate in discussions</p>
                    <Button color="primary" onPress={handleViewAllGroups}>
                      Browse Available Groups
                    </Button>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>

          <Tab key="upcoming" title={
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>Upcoming</span>
            </div>
          }>
            <div className="mt-6 flex flex-col items-center justify-center py-12">
              <Calendar size={48} className="text-default-400 mb-4" />
              <p className="text-xl font-medium mb-2">Coming Soon</p>
              <p className="text-default-500 mb-6">
                This feature is under development. Check back later for upcoming events and meetings.
              </p>
              <Button color="primary" onPress={handleViewAllGroups}>
                Browse Support Groups
              </Button>
            </div>
          </Tab>

          <Tab key="resources" title={
            <div className="flex items-center gap-2">
              <BookOpen size={18} />
              <span>Resources</span>
            </div>
          }>
            <div className="mt-6 flex flex-col items-center justify-center py-12">
              <BookOpen size={48} className="text-default-400 mb-4" />
              <p className="text-xl font-medium mb-2">Resources Coming Soon</p>
              <p className="text-default-500 mb-6">
                This feature is under development. Check back later for helpful resources.
              </p>
              <Button color="primary" onPress={handleViewAllGroups}>
                Browse Support Groups
              </Button>
            </div>
          </Tab>
        </Tabs>
      </div>
    </DefaultLayout>
  );
} 