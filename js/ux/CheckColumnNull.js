Ext.define('Ext.ux.CheckColumnNull',{
	alias: 'widget.uxnullcheckcolumn',
	extend: 'Ext.grid.column.Check',
	
	defaultRenderer : function(value, cellValues) {
		if( value===null ) {
			return '&#160;' ;
		}
		return this.callParent(arguments) ;
	},
	processEvent: function(type, view, cell, recordIndex, cellIndex, e, record, row) {
		if( this.isRecordChecked(record) === null ) {
			return Ext.grid.column.Column.prototype.processEvent.apply(this, arguments);
		}
		return this.callParent(arguments) ;
	}
}) ;
