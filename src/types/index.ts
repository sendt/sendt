export type UserRole = "BUYER" | "SELLER" | "ADMIN";
export type AuctionStatus = "UPCOMING" | "LIVE" | "ENDED" | "CANCELLED";
export type BidStatus = "ACTIVE" | "WON" | "LOST" | "REFUNDED";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatar?: string | null;
  bio?: string | null;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: Date;
  wallet?: Wallet | null;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  heldAmount: number;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description?: string | null;
  images: string[];
  startingPrice: number;
  category?: string | null;
  condition?: string | null;
}

export interface LiveStream {
  id: string;
  sellerId: string;
  title: string;
  description?: string | null;
  streamKey: string;
  isActive: boolean;
  viewerCount: number;
  startedAt?: Date | null;
  seller?: User;
  auctions?: Auction[];
}

export interface Auction {
  id: string;
  streamId: string;
  productId: string;
  title: string;
  startingPrice: number;
  currentPrice: number;
  minBidStep: number;
  buyNowPrice?: number | null;
  status: AuctionStatus;
  winnerId?: string | null;
  duration: number;
  startedAt?: Date | null;
  endedAt?: Date | null;
  product?: Product;
  bids?: Bid[];
  winner?: User | null;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  status: BidStatus;
  createdAt: Date;
  bidder?: User;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  message: string;
  isSystem: boolean;
  createdAt: Date;
  user?: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
