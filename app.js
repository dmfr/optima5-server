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
		},
		privates: {
			filterNodes: function(root, node, filterFn) {
				/*
				* https://www.sencha.com/forum/showthread.php?296893-Filtering-tree-store
				*/
				var match = false,
					childNodes = node.childNodes,
					len = childNodes && childNodes.length,
					i, child;
				if (len) {
					for (i = 0; i < len; ++i) {
						// match needs to be true if any child nodes have been found to match
						match = this.filterNodes(root, childNodes[i], filterFn) || match;
					}
				}
				// match if a child matches, or if the current node matches.
				match = match || (node === root || filterFn(node));
				node.set('visible', match, this._silentOptions);
				return match;
			}
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
	 * https://www.sencha.com/forum/showthread.php?301099-Grouping-is-not-working-when-value-is-null/page2
	 * http://forums.ext.net/showthread.php?60224&p=275467&viewfull=1#post275467
	 */
	Ext.grid.feature.Grouping.override({
		// Overridden because of #919
		getMetaGroup: function (group) {
			var metaGroupCache = this.metaGroupCache || this.createCache(),
					key,
					metaGroup;

			if (group.isModel) {
					group = this.getGroup(group);
			}

			if (group != null) { // #919. Do not replace with "!==", beucase it should filter for null and undefined.
					key = (typeof group === 'string') ? group : group.getGroupKey();
					metaGroup = metaGroupCache[key];

					if (!metaGroup) {
						metaGroup = metaGroupCache[key] = {
							isCollapsed: false,
							lastGroup: null,
							lastGroupGeneration: null,
							lastFilterGeneration: null,
							aggregateRecord: new Ext.data.Model()
						};

						if (!metaGroupCache.map) {
							metaGroupCache.map = {};
						}

						metaGroupCache.map[key] = true;
					}
			}

			return metaGroup;
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
	
	
	
	Ext.event.publisher.Focus.override({ // input.x-tree-checkbox has no parent Node ????
    doDelegatedEvent: function(e, invokeAfter) {
        var me = this,
            relatedTarget;

		if (Ext.browser.is.Firefox) {
			e = me.callParent([e, false]);
		} else {
			e = me.callSuper([e, false]);
		}

        if (e) {
            if (e.type === 'focusout' && e.target != null) {
                // If focus is departing to the document, there will be no forthcoming focusin event
                // to trigger a focusleave, to fire a focusleave now.
                if (e.relatedTarget == null && !e.target.matches('input.x-tree-checkbox')) {
                    me.processFocusIn(e, e.target, document.body, invokeAfter);
                } else {
						 
					 }
            }
            else {
                relatedTarget = e.relatedTarget;

                // IE reports relatedTarget as either an inaccessible object which coercively equates to null, or just a blank object in the case of focusing from nowhere.
                // So we can't use a truth test ternary expression to substitute in document.body.
                me.processFocusIn(e, (relatedTarget == null || !relatedTarget.tagName) ? document.body : relatedTarget, e.target, invokeAfter);
            }
        }
    }
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
