Ext.define('Ext.ux.RowBodyBis', {
    extend: 'Ext.grid.feature.Feature',
    alias: 'feature.rowbodybis',
 
    rowBodyCls: Ext.baseCSSPrefix + 'grid-row-body',
    rowBodyHiddenCls: Ext.baseCSSPrefix + 'grid-row-body-hidden',
    rowBodyTdSelector: 'td.' + Ext.baseCSSPrefix + 'grid-cell-rowbody',
    eventPrefix: 'rowbody',
    eventSelector: 'tr.' + Ext.baseCSSPrefix + 'grid-rowbody-tr',
 
    /**
     * @cfg {Boolean} [bodyBefore=false]
     * Configure as `true` to put the row expander body *before* the data row.
     */
    bodyBefore: false,
 
    outerTpl: {
        fn: function(out, values, parent) {
            var me = this.rowBody,
                view = values.view,
                columns = view.getVisibleColumnManager().getColumns(),
                rowValues = view.rowValues,
                rowExpanderCol = me.rowExpander && me.rowExpander.expanderColumn;
 
            rowValues.rowBodyColspan = columns.length;
            rowValues.rowBodyCls = me.rowBodyCls;
            
            if (rowExpanderCol && rowExpanderCol.getView() === view) {
                view.grid.removeCls(Ext.baseCSSPrefix + 'grid-hide-row-expander-spacer');
                rowValues.addSpacerCell = true;
                rowValues.rowBodyColspan -= 1;
                rowValues.spacerCellCls = Ext.baseCSSPrefix + 'grid-cell ' + Ext.baseCSSPrefix + 'grid-row-expander-spacer ' +  Ext.baseCSSPrefix + 'grid-cell-special';
            } else {
                view.grid.addCls(Ext.baseCSSPrefix + 'grid-hide-row-expander-spacer');
                rowValues.addSpacerCell = false;
            }
 
            this.nextTpl.applyOut(values, out, parent);
 
            rowValues.rowBodyCls = rowValues.rowBodyColspan = rowValues.rowBody = null;
        },
        priority: 100
    },
 
 
    init: function(grid) {
        var me = this,
            view = me.view = grid.getView();
				
			var rowBodyFeatureId = me.rowBodyFeatureId || 'rowBodyFeature' ;
			console.log(rowBodyFeatureId) ;
			
			Ext.apply(this,{
				extraRowTpl: [
					'{%',
							'if(this.rowBody.bodyBefore) {',
								// MUST output column sizing elements because the first row in this table 
								// contains one colspanning TD, and that overrides subsequent column width settings. 
								'values.view.renderColumnSizer(values, out);',
							'} else {',
								'this.nextTpl.applyOut(values, out, parent);',
							'}',
							'values.view.'+rowBodyFeatureId+'.setupRowData(values.record, values.recordIndex, values);',
					'%}',
					'<tr class="' + Ext.baseCSSPrefix + 'grid-rowbody-tr {rowBodyCls}" {ariaRowAttr}>',
							'<tpl if="addSpacerCell">',
								'<td class="{spacerCellCls}"></td>',
							'</tpl>',
							'<td class="' + Ext.baseCSSPrefix + 'grid-td ' + Ext.baseCSSPrefix + 'grid-cell-rowbody" colspan="{rowBodyColspan}" {ariaCellAttr}>',
								'<div class="' + Ext.baseCSSPrefix + 'grid-rowbody {rowBodyDivCls}" {ariaCellInnerAttr}>{rowBody}</div>',
							'</td>',
					'</tr>',
					'{%',
							'if(this.rowBody.bodyBefore) {',
								'this.nextTpl.applyOut(values, out, parent);',
							'}',
					'%}', {
							priority: 100,
			
							beginRowSync: function (rowSync) {
								rowSync.add('rowBody', this.owner.eventSelector);
							},
			
							syncContent: function(destRow, sourceRow, columnsToUpdate) {
								var owner = this.owner,
									destRowBody = Ext.fly(destRow).down(owner.eventSelector, true),
									sourceRowBody;
			
								// Sync the heights of row body elements in each row if they need it. 
								if (destRowBody && (sourceRowBody = Ext.fly(sourceRow).down(owner.eventSelector, true))) {
									Ext.fly(destRowBody).syncContent(sourceRowBody);
								}
							}
					}
				]
			});
        
        // <debug> 
        if (!me.rowExpander && grid.findPlugin('rowexpander')) {
            Ext.Error.raise('The RowBody feature shouldn\'t be manually added when the grid has a RowExpander.');
        }
        // </debug> 
 
        // The extra data means variableRowHeight 
        grid.variableRowHeight = view.variableRowHeight = true;
        view[rowBodyFeatureId] = me;
 
        view.headerCt.on({
            columnschanged: me.onColumnsChanged,
            scope: me
        });
        view.addTpl(me.outerTpl).rowBody = me;
        view.addRowTpl(Ext.XTemplate.getTpl(this, 'extraRowTpl')).rowBody = me;
        me.callParent(arguments);
    },
 
    getSelectedRow: function(view, rowIndex) {
        var selectedRow = view.getNode(rowIndex);
        if (selectedRow) {
            return Ext.fly(selectedRow).down(this.eventSelector);
        }
        return null;
    },
 
    // When columns added/removed, keep row body colspan in sync with number of columns. 
    onColumnsChanged: function(headerCt) {
        var items = this.view.el.query(this.rowBodyTdSelector),
            colspan = headerCt.getVisibleGridColumns().length,
            len = items.length,
            i;
 
        for (i = 0; i < len; ++i) {
            items[i].setAttribute('colSpan', colspan);
        }
    },
 
    /**
     * @method getAdditionalData
     * @protected
     * @template
     * Provides additional data to the prepareData call within the grid view.
     * The rowbody feature adds 3 additional variables into the grid view's template.
     * These are `rowBody`, `rowBodyCls`, and `rowBodyColspan`.
     * 
     *  - **rowBody:** *{String}* The HTML to display in the row body element.  Defaults 
     * to *undefined*.
     *  - **rowBodyCls:** *{String}* An optional CSS class (or multiple classes 
     * separated by spaces) to apply to the row body element.  Defaults to 
     * {@link #rowBodyCls}.
     *  - **rowBodyColspan:** *{Number}* The number of columns that the row body element 
     * should span.  Defaults to the number of visible columns.
     * 
     * @param {Object} data The data for this particular record.
     * @param {Number} idx The row index for this record.
     * @param {Ext.data.Model} record The record instance
     * @param {Object} orig The original result from the prepareData call to massage.
     * @return {Object} An object containing additional variables for use in the grid 
     * view's template
     */
    
    /*
     * @private
     */
    setupRowData: function(record, rowIndex, rowValues) {
        if (this.getAdditionalData) {
            Ext.apply(rowValues, this.getAdditionalData(record.data, rowIndex, record, rowValues));
        }
    }
});
