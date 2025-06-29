"""Initial migration - create suppliers and compliance_records tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-12-28 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create suppliers table
    op.create_table('suppliers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('country', sa.String(), nullable=False),
    sa.Column('contract_terms', sa.JSON(), nullable=True),
    sa.Column('compliance_score', sa.Integer(), nullable=True),
    sa.Column('last_audit', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_suppliers_id'), 'suppliers', ['id'], unique=False)
    op.create_index(op.f('ix_suppliers_name'), 'suppliers', ['name'], unique=True)

    # Create compliance_records table
    op.create_table('compliance_records',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('supplier_id', sa.Integer(), nullable=False),
    sa.Column('metric', sa.String(), nullable=False),
    sa.Column('date_recorded', sa.Date(), nullable=False),
    sa.Column('result', sa.Float(), nullable=False),
    sa.Column('expected_value', sa.Float(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('ai_analysis', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_compliance_records_id'), 'compliance_records', ['id'], unique=False)


def downgrade() -> None:
    # Drop compliance_records table
    op.drop_index(op.f('ix_compliance_records_id'), table_name='compliance_records')
    op.drop_table('compliance_records')
    
    # Drop suppliers table
    op.drop_index(op.f('ix_suppliers_name'), table_name='suppliers')
    op.drop_index(op.f('ix_suppliers_id'), table_name='suppliers')
    op.drop_table('suppliers')
