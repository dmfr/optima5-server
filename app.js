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
Ext.require('Optima5.Modules.All');

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
	 * From Ext 5.1.1, Floating inside other ELs seem to mess with Ext.dom.GarbageCollector
	 * Guess: Ext.util.Floating tries to reuse shadows cleared/invalidated by garbageCollector before ???
	 */
	Ext.util.Floating.override({
		//shadow: false
	}) ;
	Ext.dom.Underlay.override({
		hide: function() {
			this.callOverridden(arguments) ;
			this.getPool().reset() ;
		}
	}) ;
	
	/*
	 * Ext 5.1.1 : BufferedRenderer + Locking + GroupingSummary = bug on destroy if store updated 
	 * https://www.sencha.com/forum/showthread.php?303291-Grid-BufferedRenderer-Locking-GroupingSummary-bug-on-destroy-if-store-updated
	 * Seems GlobalEvent 'afterlayout' set in Ext.grid.locking.View::onUpdate is not consumed until final destroy (where it's too late to dig up records ?)
	 */
	Ext.grid.plugin.BufferedRenderer.override({
		refreshSize: function() {
			if( !this.store.data ) {
				return ;
			}
			this.callOverridden(arguments) ;
		}
	});
	
	/*
	 * Ext 5.1.1 : applyRoot if TreeStore::setRoot() called with NodeInterface
	 */
	Ext.data.TreeStore.override({
		applyRoot: function(newRoot) {
			newRoot = this.callOverridden(arguments) ;
			
			var me = this ;
			if( newRoot && newRoot.isNode && newRoot.isRoot() ) {
				newRoot.store = newRoot.treeStore = me;
			}
			return newRoot ;
		}
	});
	
	/*
	 * Ext 5.1.1 : onUpdate if filtered => non-existant group => metaGroup isCollapsed not defined
	 * fixed in 5.1.2 ?
	 */
	Ext.grid.feature.GroupStore.override({
		onUpdate: function(store, record, operation, modifiedFieldNames) {
			var me = this,
				groupingFeature = me.groupingFeature ;
			
			if (store.isGrouped() && !groupingFeature.getGroup(record)) {
				me.fireEvent('update', me, record, operation, modifiedFieldNames);
				return ;
			}
			
			this.callOverridden(arguments) ;
		}
	});
	
	/*
	 * Chrome 43 / Charts ? : draw problem
	 */
	Ext.chart.Chart.override({
		initComponent: function() {
			Ext.apply(this,{
				animate: false
			});
			this.callOverridden(arguments);
			this.on('afterrender', function(chart) {
				Ext.defer(function(){chart.redraw();},100,this);
			});
		}
	});
	
	/*
	 * Disable NavigationModels
	 */
	Ext.view.NavigationModel.override({
		focusCls: ''
	});
	Ext.grid.NavigationModel.override({
		focusCls: ''
	});
	
	
	
	
	/*
	 * Désactiver le drag&drop file=>browser(open)
	 */
	window.ondragenter = function(e) {
		e.dataTransfer.dropEffect = 'none';
		e.preventDefault();
		return false;
	};
	window.ondragover = function(e) {
		e.preventDefault();
		return false;
	};
	window.ondrop = function(e) {
		return false;
	};
	window.ondragleave = function(e) {
		return false;
	};
	
	/*
	Désactiver le click droit
	*/
	Ext.getDoc().on('contextmenu', function(e){
		e.preventDefault() ;
	}) ;
	Ext.getDoc().on('keydown', function(e){
		if( e.getKey() == e.BACKSPACE && !Ext.Array.contains(['text','password','textarea'], e.getTarget().type) ) {
			e.preventDefault();
		}
	}) ;
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
	
	
	// Needed by Ext.Scheduler :
	Ext.data.Connection.override({
		parseStatus: function (b) {
			var a = this.callOverridden(arguments);
			if (b === 0) {
					a.success = true
			}
			return a
		}
	});
});
