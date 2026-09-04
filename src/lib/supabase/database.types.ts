export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "employee" | "manager" | "admin";
export type GoalStatus = "not_started" | "in_progress" | "achieved";
export type ApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type CycleStatus = "upcoming" | "active" | "closed";
export type AppraisalStatus = "not_started" | "in_progress" | "submitted" | "completed";
export type CheckinStatus = "scheduled" | "completed" | "missed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          full_name: string;
          role: AppRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          full_name: string;
          role?: AppRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          full_name?: string;
          role?: AppRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          profile_id: string;
          manager_id: string | null;
          title: string;
          department: string;
          job_role: string;
          hire_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          manager_id?: string | null;
          title: string;
          department: string;
          job_role: string;
          hire_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          manager_id?: string | null;
          title?: string;
          department?: string;
          job_role?: string;
          hire_date?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      review_cycles: {
        Row: {
          id: string;
          name: string;
          kind: string;
          start_date: string;
          end_date: string;
          status: CycleStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          kind: string;
          start_date: string;
          end_date: string;
          status?: CycleStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          kind?: string;
          start_date?: string;
          end_date?: string;
          status?: CycleStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          employee_id: string;
          cycle_id: string;
          parent_goal_id: string | null;
          title: string;
          description: string;
          status: GoalStatus;
          approval_status: ApprovalStatus;
          manager_comment: string;
          weight: number;
          due_date: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          cycle_id: string;
          parent_goal_id?: string | null;
          title: string;
          description?: string;
          status?: GoalStatus;
          approval_status?: ApprovalStatus;
          manager_comment?: string;
          weight?: number;
          due_date?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          cycle_id?: string;
          parent_goal_id?: string | null;
          title?: string;
          description?: string;
          status?: GoalStatus;
          approval_status?: ApprovalStatus;
          manager_comment?: string;
          weight?: number;
          due_date?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      key_results: {
        Row: {
          id: string;
          goal_id: string;
          title: string;
          metric: string;
          target: number;
          current_value: number;
          unit: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          title: string;
          metric?: string;
          target?: number;
          current_value?: number;
          unit?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          title?: string;
          metric?: string;
          target?: number;
          current_value?: number;
          unit?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      appraisals: {
        Row: {
          id: string;
          cycle_id: string;
          employee_id: string;
          manager_id: string;
          self_status: AppraisalStatus;
          manager_status: AppraisalStatus;
          self_summary: string;
          manager_summary: string;
          self_rating: number | null;
          manager_rating: number | null;
          self_submitted_at: string | null;
          manager_submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          employee_id: string;
          manager_id: string;
          self_status?: AppraisalStatus;
          manager_status?: AppraisalStatus;
          self_summary?: string;
          manager_summary?: string;
          self_rating?: number | null;
          manager_rating?: number | null;
          self_submitted_at?: string | null;
          manager_submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          employee_id?: string;
          manager_id?: string;
          self_status?: AppraisalStatus;
          manager_status?: AppraisalStatus;
          self_summary?: string;
          manager_summary?: string;
          self_rating?: number | null;
          manager_rating?: number | null;
          self_submitted_at?: string | null;
          manager_submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appraisal_scores: {
        Row: {
          id: string;
          appraisal_id: string;
          competency: string;
          self_score: number | null;
          manager_score: number | null;
        };
        Insert: {
          id?: string;
          appraisal_id: string;
          competency: string;
          self_score?: number | null;
          manager_score?: number | null;
        };
        Update: {
          id?: string;
          appraisal_id?: string;
          competency?: string;
          self_score?: number | null;
          manager_score?: number | null;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          employee_id: string;
          cycle_id: string;
          scheduled_at: string;
          completed_at: string | null;
          status: CheckinStatus;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          cycle_id: string;
          scheduled_at: string;
          completed_at?: string | null;
          status?: CheckinStatus;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          cycle_id?: string;
          scheduled_at?: string;
          completed_at?: string | null;
          status?: CheckinStatus;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      kudos: {
        Row: {
          id: string;
          from_employee_id: string;
          to_employee_id: string;
          badge: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_employee_id: string;
          to_employee_id: string;
          badge: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_employee_id?: string;
          to_employee_id?: string;
          badge?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
        };
        Relationships: [];
      };
      role_skill_benchmarks: {
        Row: {
          id: string;
          job_role: string;
          skill_id: string;
          expected_level: number;
        };
        Insert: {
          id?: string;
          job_role: string;
          skill_id: string;
          expected_level: number;
        };
        Update: {
          id?: string;
          job_role?: string;
          skill_id?: string;
          expected_level?: number;
        };
        Relationships: [];
      };
      employee_skills: {
        Row: {
          employee_id: string;
          skill_id: string;
          level: number;
        };
        Insert: {
          employee_id: string;
          skill_id: string;
          level: number;
        };
        Update: {
          employee_id?: string;
          skill_id?: string;
          level?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      flight_risk_radar: {
        Row: {
          employee_id: string;
          full_name: string;
          title: string;
          department: string;
          manager_id: string | null;
          goal_completion_rate: number;
          missed_checkins: number;
          pending_reviews: number;
          risk_score: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      goal_status: GoalStatus;
      approval_status: ApprovalStatus;
      cycle_status: CycleStatus;
      appraisal_status: AppraisalStatus;
      checkin_status: CheckinStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
