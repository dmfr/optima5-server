Ext.Loader.setConfig({
	enabled: true,
	disableCaching: true,
	paths: {
		'Ext': './extjs/src', 
		'Ext.ux' : './js/ux',
		'Ext.calendar' : './js/ext/calendar',
		'Sch' : './js/sch',
		'Optima5' : './js/app'
		}
});
Ext.require('Ext.*') ;
Ext.require('Optima5.App');

var op5desktop, op5session ;
Ext.onReady(function () {
	/*
	Load record for multi-select COMBO
	http://www.sencha.com/forum/archive/index.php/t-202456.html?s=ef437a00595a4b216c80d979879ef5fc
	http://stackoverflow.com/questions/6299164/using-ext-form-basic-loadrecord-to-load-data-into-combo-box-fields-with-remote-s
	*/
	Ext.form.field.ComboBox.override( {
		setValue: function(v) {
			if( Ext.JSON.decode(v,true) != null ) {
				arguments[0] = Ext.JSON.decode(v) ;
			}
			this.callOverridden(arguments);
		}
	});
	
	/*
	DATE FIELD : treat 0000-00-00 as null
	*/
	Ext.form.field.Date.override( {
		setValue: function() {
			if( arguments[0] == '0000-00-00' ) {
				arguments[0] = null ;
			}
			this.callOverridden(arguments);
		}
	});
	
	/*
	 * Hide grouping summary if empty
	 */
	Ext.grid.feature.GroupingSummary.override({
		outputSummaryRecord: function(summaryRecord, contextValues, out) {
			var view = contextValues.view,
					columns = contextValues.columns || view.headerCt.getVisibleGridColumns(),
					colCount = columns.length, i, column,
					isNull = true ;
			for (i = 0; i < colCount; i++) {
					column = columns[i];
				if (!column.summaryType) {
					continue ;
				}
				if( !column.dataIndex || summaryRecord.get(column.dataIndex) == null ) {
					continue ;
				}
				isNull = false ;
			}
			
			if( isNull ) {
				return ;
			}
			this.callOverridden(arguments) ;
		}
	}) ;
	
	
	
	
	
	
	
	
	/*
	 * From Ext 4.2 , Ext.view.Table monitors all DOM events to fire 'uievent'
	 *  If a view.Table is nested in a higher view.Table (ComponentRowExpander...),
	 *  this would cause higher view.Table to select nested cell as e.getTarget(cellselector) result
	 *  => check selected cell has actually a header in current grid before continuing
	 */
	Ext.view.Table.override( {
		processItemEvent: function(record, row, rowIndex, e) {
			var cell = e.getTarget(this.getCellSelector(), row) ;
			if( cell && this.getHeaderByCell(cell) == null ) {
				return false;
			}
			this.callOverridden(arguments) ;
		}
	}) ;
	
	/*
	 * From Ext 4.2...
	 * Ext.grid.plugin.Editing (parent of RowEditing) checks that an editor has been defined on clicked cell (to start editing row)
	 * => restore Ext 4.1 behavior (startEdit whether editor is defined or not)
	 */
	Ext.grid.plugin.RowEditing.override( {
		onCellClick: function(view, cell, colIdx, record, row, rowIdx, e) {
			// Make sure that the column has an editor.  In the case of CheckboxModel,
			// calling startEdit doesn't make sense when the checkbox is clicked.
			// Also, cancel editing if the element that was clicked was a tree expander.
			var expanderSelector = view.expanderSelector,
				// Use getColumnManager() in this context because colIdx includes hidden columns.
				columnHeader = view.ownerCt.getColumnManager().getHeaderAtIndex(colIdx),
				editor = columnHeader.getEditor(record);
			
			if ( !expanderSelector || !e.getTarget(expanderSelector)) {
				this.startEdit(record, columnHeader);
			}
		}
	}) ;
	
	/*
	 * Ext 4.1 : Ext.grid.RowEditor "layouts" itself on every startEdit
	 * From Ext 4.2, Ext.grid.RowEditor monitors columns on trigger components layout on add/remove/resize/move... BUT misses column::setEditor()
	 * => force syncAllFieldWidths() on every startEdit
	 */
	Ext.grid.RowEditor.override( {
		onShow: function() {
			var me = this;
			
			me.callParent(arguments);
			if (true) {
				me.suspendLayouts();
				me.syncAllFieldWidths();
				me.resumeLayouts(true);
			}
			delete me.needsSyncFieldWidths;
			
			me.reposition();
		}
	});
	
	
	/*
	Désactiver le click droit
	*/
	Ext.getBody().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
});
