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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Badge,
} from "@heroui/react";
import {
  Users,
  Calendar,
  MessageSquare,
  Send,
  MoreVertical,
  ThumbsUp,
  Edit,
  Trash,
  RefreshCw,
  Flag,
  Video,
  UserCheck,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useSupportGroup } from "../hooks/useSupportGroup";
import { usePost } from "../hooks/usePost";
import { useUser } from "../hooks/useUser";
import { useReport } from "../hooks/useReport";
import { useMeeting } from "../hooks/useMeeting";
import { useState, useEffect } from "react";
import { postService, userService } from "../services/services";
import { ReportedType, MeetingStatus } from "../interfaces/enums";


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

interface PostData {
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  tags: string[];
}

interface Post {
  post: PostData;
  likes: PostLike[];
  comments: Comment[];
  like_count: number;
  author?: PostAuthor;
}


interface Meeting {
  meeting_id: string;
  title: string;
  description?: string;
  scheduled_time: string;
  status: MeetingStatus;
  support_group_id: string;
  group_title: string;
  participant_count: number;
  is_participant: boolean;
  is_host: boolean;
  meeting_chat_id?: string;
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
  const [searchInput, setSearchInput] = useState("");
  const [usePagination, setUsePagination] = useState(false);

  // Report state
  const [reportingItem, setReportingItem] = useState<{ id: string, type: ReportedType, userId: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();

  // Get support group hooks
  const { getMyGroups } = useSupportGroup();

  // Get user hooks
  const { currentUser } = useUser();

  // Get meeting hooks
  const { getUserMeetings } = useMeeting();

  // Get post hooks
  const {
    createPost,
    isCreatingPost,
    updatePost,
    isUpdatingPost,
    deletePost,
    likePost,
    isLikingPost,
    commentOnPost,
    isCommentingOnPost,
    updateComment,
    isUpdatingComment,
    deleteComment,
  } = usePost();

  // Get report hooks
  const { createReport, isCreatingReport } = useReport();

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
        const response = await postService.getPosts(pageParam, searchTags, sortBy);
        return response.data;
      } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total_count / lastPage.posts_per_page);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !usePagination,
  });

  // Add a new query for paginated posts
  const {
    data: paginatedPostsResponse,
    isLoading: isLoadingPaginatedPosts,
    error: paginatedPostsError,
    refetch: refetchPaginatedPosts,
  } = useQuery({
    queryKey: ['posts', 'paginated', page, searchTags, sortBy],
    queryFn: async () => {
      try {
        const response = await postService.getPosts(page, searchTags, sortBy);
        return response.data;
      } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
      }
    },
    enabled: usePagination, // Only enable this query when using pagination
  });

  // Fetch my support groups using the hook
  const {
    data: myGroupsResponse,
    isLoading: isLoadingMyGroups,
    error: _myGroupsError,
  } = useQuery(getMyGroups());

  // Fetch my meetings
  const {
    data: myMeetingsResponse,
    isLoading: isLoadingMyMeetings,
    error: myMeetingsError,
    refetch: refetchMeetings,
  } = useQuery(getUserMeetings());

  // Extract the actual data from the responses
  const myGroups = myGroupsResponse || [];
  const myMeetings = myMeetingsResponse?.data || [];

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
    if (!postsResponse?.pages && !paginatedPostsResponse) return;

    const fetchAuthors = async () => {
      const allPosts: Post[] = [];

      if (usePagination && paginatedPostsResponse) {
        // Process posts from paginated response
        for (const post of paginatedPostsResponse.posts) {
          // Determine if we're dealing with a flat or nested structure
          const isFlat = !post.post;
          const authorId = isFlat ? post.author_id : post.post.author_id;

          // Get author data for the post
          const authorData = await fetchUserData(authorId);

          // Create a properly structured post object
          const postWithAuthor: Post = {
            post: isFlat ? {
              post_id: post.post_id,
              author_id: post.author_id,
              content: post.content,
              created_at: post.created_at,
              tags: post.tags || []
            } : post.post,
            likes: post.likes || [],
            comments: post.comments || [],
            like_count: post.like_count || 0,
            author: authorData
          };

          // Get author data for all comments
          const commentsWithAuthors = await Promise.all(
            postWithAuthor.comments.map(async (comment: Comment) => {
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
      } else if (postsResponse?.pages) {
        // Process posts from infinite query response
        for (const page of postsResponse.pages) {
          for (const post of page.posts) {
            // Determine if we're dealing with a flat or nested structure
            const isFlat = !post.post;
            const authorId = isFlat ? post.author_id : post.post.author_id;

            // Get author data for the post
            const authorData = await fetchUserData(authorId);

            // Create a properly structured post object
            const postWithAuthor: Post = {
              post: isFlat ? {
                post_id: post.post_id,
                author_id: post.author_id,
                content: post.content,
                created_at: post.created_at,
                tags: post.tags || []
              } : post.post,
              likes: post.likes || [],
              comments: post.comments || [],
              like_count: post.like_count || 0,
              author: authorData
            };

            // Get author data for all comments
            const commentsWithAuthors = await Promise.all(
              postWithAuthor.comments.map(async (comment: Comment) => {
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
      }

      setPostsWithAuthors(allPosts);
    };

    fetchAuthors();
  }, [postsResponse, paginatedPostsResponse, usePagination]);

  // Handle navigating to a support group's dashboard
  const handleViewGroup = (groupId: string) => {
    navigate(`/support-groups/${groupId}`);
  };

  // Handle navigating to the support groups page
  const handleViewAllGroups = () => {
    navigate('/support-groups');
  };

  // Handle navigating to a meeting
  const handleViewMeeting = (meetingId: string) => {
    navigate(`/meetings/${meetingId}`);
  };

  // Handle creating a new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    // Add validation for minimum content length
    if (newPostContent.trim().length <= 5) {
      // Show error message
      alert("Post content must be more than 5 characters long");
      return;
    }

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
    // Refetch posts to update the UI with the latest data
    refetchPosts();
  };

  // Handle commenting on a post
  const handleComment = async (postId: string, parentCommentId?: string) => {
    if (!commentContent.trim()) return;

    // Add validation for minimum comment length
    if (commentContent.trim().length <= 5) {
      alert("Comment must be more than 5 characters long");
      return;
    }

    await commentOnPost({
      postId,
      content: commentContent,
      parentCommentId,
    });

    setCommentContent("");
    setReplyingTo(null);
    // Refetch posts to update the UI with the latest data
    refetchPosts();
  };

  // Handle updating a post
  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;

    // Add validation for minimum content length
    if (editContent.trim().length <= 5) {
      alert("Post content must be more than 5 characters long");
      return;
    }

    await updatePost({
      postId,
      postData: { content: editContent },
    });

    setEditingPost(null);
    setEditContent("");
    // Refetch posts to update the UI with the latest data
    refetchPosts();
  };

  // Handle updating a comment
  const handleUpdateComment = async (commentId: string, postId: string) => {
    if (!editContent.trim()) return;

    // Add validation for minimum content length
    if (editContent.trim().length <= 5) {
      alert("Comment must be more than 5 characters long");
      return;
    }

    await updateComment({
      commentId,
      content: editContent,
      postId,
    });

    setEditingComment(null);
    setEditContent("");
    refetchPosts();
  };

  // Handle deleting a post
  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      await deletePost(postId);
      // Refetch posts to update the UI with the latest data
      refetchPosts();
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteComment({
        commentId,
        postId,
      });
      // Refetch posts to update the UI with the latest data
      refetchPosts();
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

  // Get status badge color based on meeting status
  const getMeetingStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.Ongoing:
        return "success";
      case MeetingStatus.Upcoming:
        return "primary";
      case MeetingStatus.Ended:
        return "default";
      default:
        return "default";
    }
  };

  // Get status badge text based on meeting status
  const getMeetingStatusText = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.Ongoing:
        return "Ongoing";
      case MeetingStatus.Upcoming:
        return "Upcoming";
      case MeetingStatus.Ended:
        return "Ended";
      default:
        return "Unknown";
    }
  };

  // Render nested comments recursively
  const renderComments = (comments: Comment[], postId: string, parentId: string | null = null) => {
    const filteredComments = comments.filter(
      comment => comment.parent_comment_id === parentId
    );

    if (filteredComments.length === 0) return null;

    // Add a function to navigate to user profile
    const navigateToUserProfile = (username: string) => {
      navigate(`/users/${username}`);
    };

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
                <Button
                  isIconOnly
                  variant="light"
                  className="p-0 min-w-0"
                  onPress={() => comment.author?.username && navigateToUserProfile(comment.author.username)}
                >
                  <Avatar
                    src={comment.author?.avatar_url}
                    name={(comment.author?.username || "U").charAt(0).toUpperCase()}
                    size="sm"
                  />
                </Button>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Button
                        variant="light"
                        className="p-0 h-auto min-w-0 font-semibold"
                        onPress={() => comment.author?.username && navigateToUserProfile(comment.author.username)}
                      >
                        {comment.author?.username || "User"}
                      </Button>
                      <span className="text-xs text-default-400 ml-2">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {isAuthor ? (
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
                    ) : (
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Comment actions">
                          <DropdownItem
                            key="report-comment"
                            startContent={<Flag size={16} />}
                            className="text-warning"
                            onPress={() => openReportModal(comment.comment_id, ReportedType.Comment, comment.author_id)}
                          >
                            Report
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
                        isInvalid={editContent.trim().length > 0 && editContent.trim().length <= 5}
                        errorMessage={editContent.trim().length > 0 && editContent.trim().length <= 5 ? "Comment must be more than 5 characters long" : ""}
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
                          isDisabled={!editContent.trim() || editContent.trim().length <= 5}
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
                        isInvalid={commentContent.trim().length > 0 && commentContent.trim().length <= 5}
                        errorMessage={commentContent.trim().length > 0 && commentContent.trim().length <= 5 ? "Reply must be more than 5 characters" : ""}
                        isDisabled={isCommentingOnPost}
                        endContent={
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleComment(postId, comment.comment_id)}
                            isLoading={isCommentingOnPost}
                            isDisabled={!commentContent.trim() || commentContent.trim().length <= 5 || isCommentingOnPost}
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

  // Handle reporting a post or comment
  const handleReport = () => {
    if (!reportingItem || !reportReason.trim()) return;

    createReport({
      reported_user_id: reportingItem.userId,
      reason: reportReason,
      reported_type: reportingItem.type,
      reported_item_id: reportingItem.id
    });

    setReportReason("");
    setReportingItem(null);
    onReportClose();
  };

  // Open report modal for a post
  const openReportModal = (id: string, type: ReportedType, userId: string) => {
    setReportingItem({ id, type, userId });
    onReportOpen();
  };

  // Render post cards
  const renderPosts = () => {
    if (postsWithAuthors.length === 0) return null;

    return postsWithAuthors.map(post => {
      const isAuthor = currentUser?.user_id === post.post.author_id;
      const isLiked = post.likes.some(like => like.user_id === currentUser?.user_id);
      const isExpanded = expandedComments.has(post.post.post_id);

      // Add a function to navigate to user profile
      const navigateToUserProfile = (username: string) => {
        navigate(`/users/${username}`);
      };

      return (
        <Card key={post.post.post_id} className="mb-4">
          <CardHeader className="flex gap-3">
            <Button
              isIconOnly
              variant="light"
              className="p-0 min-w-0"
              onPress={() => post.author?.username && navigateToUserProfile(post.author.username)}
            >
              <Avatar
                src={post.author?.avatar_url}
                name={(post.author?.username || "U").charAt(0).toUpperCase()}
                size="md"
              />
            </Button>
            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <Button
                    variant="light"
                    className="p-0 h-auto min-w-0 font-semibold text-md"
                    onPress={() => post.author?.username && navigateToUserProfile(post.author.username)}
                  >
                    {post.author?.username || "User"}
                  </Button>
                  <p className="text-small text-default-500">
                    {formatDate(post.post.created_at)}
                  </p>
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Post actions">
                    {isAuthor ? (
                      <>
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
                      </>
                    ) : (
                      <DropdownItem
                        key="report-post"
                        startContent={<Flag size={16} />}
                        className="text-warning"
                        onPress={() => openReportModal(post.post.post_id, ReportedType.Post, post.post.author_id)}
                      >
                        Report
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
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
                  isInvalid={editContent.trim().length > 0 && editContent.trim().length <= 5}
                  errorMessage={editContent.trim().length > 0 && editContent.trim().length <= 5 ? "Post content must be more than 5 characters long" : ""}
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
                    isDisabled={!editContent.trim() || editContent.trim().length <= 5}
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
                  isDisabled={isLikingPost}
                >
                  {post.like_count} {post.like_count === 1 ? "Like" : "Likes"}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  startContent={<MessageSquare size={16} />}
                  onPress={() => toggleExpandComments(post.post.post_id)}
                  isDisabled={isCommentingOnPost}
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
                    isInvalid={commentContent.trim().length > 0 && commentContent.trim().length <= 5}
                    errorMessage={commentContent.trim().length > 0 && commentContent.trim().length <= 5 ? "Comment must be more than 5 characters" : ""}
                    isDisabled={isCommentingOnPost}
                    endContent={
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleComment(post.post.post_id)}
                        isLoading={isCommentingOnPost}
                        isDisabled={!commentContent.trim() || commentContent.trim().length <= 5 || isCommentingOnPost}
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

  // Handle page change in pagination mode
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTags(searchInput);
    setPage(1); // Reset to first page when searching
    if (usePagination) {
      refetchPaginatedPosts();
    } else {
      refetchPosts();
    }
  };

  // Toggle between pagination and infinite scroll
  const togglePaginationMode = () => {
    setUsePagination(!usePagination);
    setPage(1); // Reset to first page when switching modes
  };

  if (isLoadingPosts && isLoadingMyGroups && isLoadingMyMeetings) {
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
                      isInvalid={newPostContent.trim().length > 0 && newPostContent.trim().length <= 5}
                      errorMessage={newPostContent.trim().length > 0 && newPostContent.trim().length <= 5 ? "Post content must be more than 5 characters long" : ""}
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
                        isDisabled={!newPostContent.trim() || newPostContent.trim().length <= 5}
                      >
                        Post
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              <div className="mb-6">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by tags (comma separated)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="flex-1"
                      startContent={<span className="text-small text-default-400">🔍</span>}
                      endContent={
                        <Button
                          type="submit"
                          color="primary"
                          size="sm"
                          isDisabled={!searchInput.trim()}
                        >
                          Search
                        </Button>
                      }
                    />
                    <Button
                      variant="flat"
                      color={searchTags ? "danger" : "default"}
                      onPress={() => {
                        setSearchInput("");
                        setSearchTags("");
                        setPage(1);
                        if (usePagination) {
                          refetchPaginatedPosts();
                        } else {
                          refetchPosts();
                        }
                      }}
                      isDisabled={!searchTags}
                    >
                      Clear
                    </Button>
                  </div>
                </form>

                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-small text-default-500">Sort by:</span>
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
                      onPress={() => {
                        if (usePagination) {
                          refetchPaginatedPosts();
                        } else {
                          refetchPosts();
                        }
                      }}
                      isLoading={isLoadingPosts || isLoadingPaginatedPosts}
                      size="sm"
                    >
                      Refresh
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="flat"
                      color="secondary"
                      size="sm"
                      onPress={togglePaginationMode}
                    >
                      {usePagination ? "Use Infinite Scroll" : "Use Pagination"}
                    </Button>
                  </div>
                </div>

                {((postsError && !usePagination) || (paginatedPostsError && usePagination)) ? (
                  <Card className="p-6 text-center">
                    <CardBody className="flex flex-col items-center">
                      <p className="text-danger">Error loading posts. Please try again.</p>
                    </CardBody>
                  </Card>
                ) : (
                  <>
                    {renderPosts()}

                    {/* Show pagination controls when in pagination mode */}
                    {usePagination && paginatedPostsResponse && (
                      <div className="flex justify-center mt-4 mb-8">
                        <Pagination
                          total={Math.ceil(paginatedPostsResponse.total_count / paginatedPostsResponse.posts_per_page)}
                          initialPage={page}
                          page={page}
                          onChange={handlePageChange}
                          showControls
                          showShadow
                          color="primary"
                          size="lg"
                        />
                      </div>
                    )}

                    {/* Show load more button when in infinite scroll mode */}
                    {!usePagination && hasNextPage && (
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

                    {postsWithAuthors.length === 0 && !isLoadingPosts && !isLoadingPaginatedPosts && (
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

          <Tab key="meetings" title={
            <div className="flex items-center gap-2">
              <Video size={18} />
              <span>My Meetings</span>
            </div>
          }>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Video size={20} />
                  Your Meetings
                </h2>
                <Button
                  variant="light"
                  startContent={<RefreshCw size={16} />}
                  onPress={() => refetchMeetings()}
                  isLoading={isLoadingMyMeetings}
                  size="sm"
                >
                  Refresh
                </Button>
              </div>

              {myMeetingsError ? (
                <Card className="p-6 text-center">
                  <CardBody className="flex flex-col items-center">
                    <p className="text-danger">Error loading meetings. Please try again.</p>
                  </CardBody>
                </Card>
              ) : myMeetings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {myMeetings.map((meeting: Meeting) => (
                    <Card
                      key={meeting.meeting_id}
                      isPressable
                      onPress={() => handleViewMeeting(meeting.meeting_id)}
                      className="border border-default-200 hover:border-primary transition-all"
                    >
                      <CardHeader className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-lg font-semibold">{meeting.title}</p>
                            <Badge color={getMeetingStatusColor(meeting.status)}>
                              {getMeetingStatusText(meeting.status)}
                            </Badge>
                            {meeting.is_host && (
                              <Badge color="warning" variant="flat">Host</Badge>
                            )}
                          </div>
                          <p className="text-small text-default-500">
                            Group: {meeting.group_title}
                          </p>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <div className="flex flex-col gap-2">
                          {meeting.description && (
                            <p className="text-sm">{meeting.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-default-500">
                            <Calendar size={16} />
                            <span>Scheduled time: {new Date(meeting.scheduled_time).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-default-500">
                            <UserCheck size={16} />
                            <span>{meeting.participant_count} participants</span>
                          </div>
                        </div>
                      </CardBody>
                      <Divider />
                      <CardFooter>
                        <Button
                          color="primary"
                          variant="flat"
                          fullWidth
                          onPress={() => handleViewMeeting(meeting.meeting_id)}
                        >
                          {meeting.status === MeetingStatus.Ongoing ? "Join Meeting" : "View Details"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <CardBody className="flex flex-col items-center">
                    <Video size={48} className="text-default-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">You have no meetings</h3>
                    <p className="text-default-500 mb-6">
                      You haven&apos;t joined any meetings yet. Check your support groups for upcoming meetings.
                    </p>
                    <Button color="primary" onPress={handleViewAllGroups}>
                      Browse Support Groups
                    </Button>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Report Modal */}
      <Modal isOpen={isReportOpen} onClose={onReportClose}>
        <ModalContent>
          <ModalHeader>Report {reportingItem?.type}</ModalHeader>
          <ModalBody>
            <p className="mb-2">Please provide a reason for reporting this {reportingItem?.type.toLowerCase()}:</p>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter reason for report..."
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onReportClose}>
              Cancel
            </Button>
            <Button
              color="warning"
              onPress={handleReport}
              isLoading={isCreatingReport}
              isDisabled={!reportReason.trim()}
            >
              Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
} 