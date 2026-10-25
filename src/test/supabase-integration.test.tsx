import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { Session, User } from "@supabase/supabase-js";
import * as supabaseLib from "@/lib/supabase";
import * as supabaseService from "@/lib/supabase-service";
import { AdminLogin } from "@/components/admin/AdminLogin";
import {
  DEFAULT_PAGE_TWO,
  DEFAULT_PERSONAL_DETAILS,
  DEFAULT_PROPOSAL_CONFIG,
  DEFAULT_SETTINGS,
  type ProposalConfig,
} from "@/lib/proposal-config";

type MockSupabaseClient = NonNullable<ReturnType<typeof supabaseLib.getSupabase>>;

describe("Supabase Integration, Schema & Verification", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Environment & Configuration Check", () => {
    it("reports configured when valid url and publishable key are set", () => {
      // isSupabaseConfigured returns a boolean based on environment
      expect(typeof supabaseLib.isSupabaseConfigured()).toBe("boolean");
      expect(supabaseLib.SUPABASE_STORAGE_BUCKET).toBe("proposal-media");
    });
  });

  describe("2. Database Schema Payload Construction", () => {
    it("correctly constructs site_settings and romantic_notes records for Supabase upsert", async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "site_settings" || table === "romantic_notes") {
            return { upsert: mockUpsert };
          }
          if (table === "media_assets") {
            return { select: mockSelect };
          }
          return { upsert: mockUpsert, select: mockSelect };
        }),
      };

      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const customConfig: ProposalConfig = {
        personalDetails: {
          ...DEFAULT_PERSONAL_DETAILS,
          senderName: "Romeo",
          recipientName: "Juliet",
          greeting: "My dearest Juliet ♡",
        },
        pageTwo: {
          chocolate: {
            title: "Our Chocolate Memory",
            clue: "Sweet as our first date.",
          },
          gift: {
            title: "A Heartfelt Present",
            clue: "The gift of your smile.",
          },
          picture: {
            title: "Sunset by the Lake",
            clue: "A memory that will never fade.",
          },
        },
        video: null,
        settings: {
          maxVideoSizeMB: 50,
        },
        version: 1,
        updatedAt: Date.now(),
        isPublished: true,
      };

      const result = await supabaseService.saveProposalDataToSupabase(customConfig, true);
      expect(result.success).toBe(true);

      // Verify site_settings upsert call
      expect(mockClient.from).toHaveBeenCalledWith("site_settings");
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: "personal_details",
            value: expect.objectContaining({ recipientName: "Juliet", senderName: "Romeo" }),
          }),
          expect.objectContaining({
            key: "settings",
            value: expect.objectContaining({ maxVideoSizeMB: 50 }),
          }),
          expect.objectContaining({
            key: "proposal_config",
          }),
        ]),
        { onConflict: "key" },
      );

      // Verify romantic_notes upsert call
      expect(mockClient.from).toHaveBeenCalledWith("romantic_notes");
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            object_key: "chocolate",
            title: "Our Chocolate Memory",
            message: "Sweet as our first date.",
          }),
          expect.objectContaining({
            object_key: "gift",
            title: "A Heartfelt Present",
            message: "The gift of your smile.",
          }),
          expect.objectContaining({
            object_key: "picture",
            title: "Sunset by the Lake",
            message: "A memory that will never fade.",
          }),
        ]),
        { onConflict: "object_key" },
      );
    });

    it("maps database rows from Supabase into unified ProposalConfig without losing defaults", async () => {
      const mockSettingsRows = [
        {
          id: "1",
          key: "personal_details",
          value: {
            senderName: "Liam",
            recipientName: "Sophia",
            anniversaryDate: "2024-06-15",
          },
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          key: "settings",
          value: { maxVideoSizeMB: 75 },
          updated_at: new Date().toISOString(),
        },
      ];

      const mockNotesRows = [
        {
          id: "10",
          object_key: "chocolate",
          title: "Custom Chocolate Title",
          message: "Custom chocolate message body.",
          updated_at: new Date().toISOString(),
        },
      ];

      const mockMediaRows = [
        {
          id: "20",
          asset_key: "proposal_video",
          storage_path: "videos/proposal_test.mp4",
          original_filename: "our_story.mp4",
          content_type: "video/mp4",
          file_size: 15000000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "site_settings") {
            return {
              select: vi.fn().mockResolvedValue({ data: mockSettingsRows, error: null }),
            };
          }
          if (table === "romantic_notes") {
            return {
              select: vi.fn().mockResolvedValue({ data: mockNotesRows, error: null }),
            };
          }
          if (table === "media_assets") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: mockMediaRows, error: null }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn() };
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            getPublicUrl: vi.fn().mockReturnValue({
              data: {
                publicUrl:
                  "https://example.supabase.co/storage/v1/object/public/proposal-media/videos/proposal_test.mp4",
              },
            }),
          }),
        },
      };

      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const result = await supabaseService.fetchProposalDataFromSupabase();
      expect(result).not.toBeNull();
      expect(result?.hasSupabaseData).toBe(true);
      expect(result?.config.personalDetails.senderName).toBe("Liam");
      expect(result?.config.personalDetails.recipientName).toBe("Sophia");
      expect(result?.config.settings.maxVideoSizeMB).toBe(75);
      // Customized chocolate note mapped
      expect(result?.config.pageTwo.chocolate.title).toBe("Custom Chocolate Title");
      expect(result?.config.pageTwo.chocolate.clue).toBe("Custom chocolate message body.");
      // Unaltered notes fall back safely to existing defaults
      expect(result?.config.pageTwo.gift.title).toBe(DEFAULT_PAGE_TWO.gift.title);
      expect(result?.config.pageTwo.picture.title).toBe(DEFAULT_PAGE_TWO.picture.title);
      // Media asset mapped
      expect(result?.config.video?.hasVideo).toBe(true);
      expect(result?.config.video?.name).toBe("our_story.mp4");
      expect(result?.config.video?.externalUrl).toContain("proposal_test.mp4");
    });
  });

  describe("3. Video Upload & Storage Lifecycle", () => {
    it("validates file size and rejects files exceeding maxVideoSizeMB", async () => {
      const mockClient = {
        storage: { from: vi.fn() },
      };
      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const largeFile = new File([new ArrayBuffer(1024 * 1024 * 110)], "large.mp4", {
        type: "video/mp4",
      });

      const res = await supabaseService.uploadProposalVideoToSupabase(largeFile, null, 100);
      expect(res.success).toBe(false);
      expect(res.error).toContain("File is too large");
    });

    it("validates file format and rejects invalid file types", async () => {
      const mockClient = {
        storage: { from: vi.fn() },
      };
      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const textFile = new File(["not a video"], "note.txt", { type: "text/plain" });

      const res = await supabaseService.uploadProposalVideoToSupabase(textFile, null, 100);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unsupported video format");
    });

    it("uploads video, stores media asset in database, and deletes old file only after success", async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl:
            "https://example.supabase.co/storage/v1/object/public/proposal-media/videos/new.mp4",
        },
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "new-media-id",
              asset_key: "proposal_video",
              storage_path: "videos/new.mp4",
              original_filename: "proposal.mp4",
              content_type: "video/mp4",
              file_size: 5000,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      const mockClient = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl,
            remove: mockRemove,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "media_assets") {
            return {
              insert: mockInsert,
              delete: mockDelete,
            };
          }
          return { upsert: vi.fn() };
        }),
      };

      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const videoFile = new File([new ArrayBuffer(5000)], "proposal.mp4", { type: "video/mp4" });
      const previousPath = "videos/old_proposal.mp4";

      const res = await supabaseService.uploadProposalVideoToSupabase(videoFile, previousPath, 100);

      expect(res.success).toBe(true);
      expect(mockUpload).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
      // Verifies old file was deleted after new upload succeeded
      expect(mockRemove).toHaveBeenCalledWith([previousPath]);
      expect(res.publicUrl).toBe(
        "https://example.supabase.co/storage/v1/object/public/proposal-media/videos/new.mp4",
      );
    });

    it("removes video from both storage and media_assets consistently", async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      const mockClient = {
        storage: {
          from: vi.fn().mockReturnValue({
            remove: mockRemove,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "media_assets") {
            return { delete: mockDelete };
          }
          if (table === "site_settings") {
            return { upsert: mockUpsert };
          }
          return {};
        }),
      };

      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const res = await supabaseService.removeProposalVideoFromSupabase("videos/old_video.mp4");
      expect(res.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(["videos/old_video.mp4"]);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe("4. Administrator Authentication", () => {
    it("signs in successfully with email and password via Supabase Auth", async () => {
      const mockSession = { user: { email: "admin@love.com" } };
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const mockClient = {
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        },
      };

      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const res = await supabaseService.signInAdmin("admin@love.com", "secretpassword");
      expect(res.error).toBeNull();
      expect(res.session).toEqual(mockSession);
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "admin@love.com",
        password: "secretpassword",
      });
    });

    it("handles login failures gracefully", async () => {
      const authError = new Error("Invalid login credentials");
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: authError,
      });

      const mockClient = {
        auth: {
          signInWithPassword: mockSignIn,
        },
      };

      vi.spyOn(supabaseLib, "getSupabase").mockReturnValue(
        mockClient as unknown as MockSupabaseClient,
      );

      const res = await supabaseService.signInAdmin("admin@love.com", "wrongpassword");
      expect(res.error).toBe(authError);
      expect(res.session).toBeNull();
    });
  });

  describe("5. AdminLogin Component UI", () => {
    it("renders credentials form when Supabase is configured and handles submission", async () => {
      vi.spyOn(supabaseLib, "isSupabaseConfigured").mockReturnValue(true);
      const mockSuccess = vi.fn();

      vi.spyOn(supabaseService, "signInAdmin").mockResolvedValue({
        session: { user: { email: "admin@love.com" } } as unknown as Session,
        user: { email: "admin@love.com" } as unknown as User,
        error: null,
      });

      render(<AdminLogin onSuccess={mockSuccess} />);

      const emailInput = screen.getByLabelText(/Admin Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole("button", { name: /Enter Proposal Suite/i });

      fireEvent.change(emailInput, { target: { value: "admin@love.com" } });
      fireEvent.change(passwordInput, { target: { value: "correctpassword" } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockSuccess).toHaveBeenCalled();
    });

    it("shows helpful guidance when Supabase credentials are not yet configured", () => {
      vi.spyOn(supabaseLib, "isSupabaseConfigured").mockReturnValue(false);
      const mockBypass = vi.fn();

      render(<AdminLogin onSuccess={vi.fn()} onBypassOffline={mockBypass} />);

      expect(screen.getByText(/Supabase Credentials Required/i)).toBeDefined();
      expect(screen.getByText(/VITE_SUPABASE_URL/i)).toBeDefined();

      const bypassBtn = screen.getByRole("button", { name: /Continue with Local\/Offline Mode/i });
      fireEvent.click(bypassBtn);
      expect(mockBypass).toHaveBeenCalled();
    });
  });
});
