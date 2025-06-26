export type Expr = LiteralExpr | VariableExpr | AssignExpr | BinaryExpr | UnaryExpr | LogicalExpr | CallExpr | GroupingExpr;

export interface LiteralExpr { kind: "Literal"; value: any; }
export interface VariableExpr { kind: "Variable"; name: string; }
export interface AssignExpr { kind: "Assign"; name: string; value: Expr; }
export interface BinaryExpr { kind: "Binary"; left: Expr; operator: string; right: Expr; }
export interface UnaryExpr { kind: "Unary"; operator: string; right: Expr; }
export interface LogicalExpr { kind: "Logical"; left: Expr; operator: string; right: Expr; }
export interface CallExpr { kind: "Call"; callee: Expr; args: Expr[]; }
export interface GroupingExpr { kind: "Grouping"; expression: Expr; }

export type Stmt = VarStmt | FunctionStmt | PrintStmt | ExpressionStmt | ReturnStmt | IfStmt | WhileStmt | ForStmt | BlockStmt;

export interface VarStmt { kind: "VarStmt"; name: string; initializer?: Expr; }
export interface FunctionStmt { kind: "FunctionStmt"; name: string; params: string[]; body: Stmt[]; }
export interface PrintStmt { kind: "PrintStmt"; expression: Expr; }
export interface ExpressionStmt { kind: "ExpressionStmt"; expression: Expr; }
export interface ReturnStmt { kind: "ReturnStmt"; value?: Expr; }
export interface IfStmt { kind: "IfStmt"; condition: Expr; thenBranch: Stmt; elseBranch?: Stmt; }
export interface WhileStmt { kind: "WhileStmt"; condition: Expr; body: Stmt; }
export interface ForStmt { kind: "ForStmt"; initializer: Stmt | null; condition: Expr | null; increment: Expr | null; body: Stmt; }
export interface BlockStmt { kind: "BlockStmt"; statements: Stmt[]; }
